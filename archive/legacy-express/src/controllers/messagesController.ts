import { Request, Response } from 'express';
import pool from '../database/db';

// Get all conversations for a user
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const query = `
      WITH latest_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END
        )
        m.*,
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as other_user_id
        FROM messages m
        WHERE (sender_id = $1 OR receiver_id = $1)
          AND NOT (sender_id = $1 AND is_deleted_by_sender = true)
          AND NOT (receiver_id = $1 AND is_deleted_by_receiver = true)
        ORDER BY 
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END,
          created_at DESC
      )
      SELECT 
        lm.*,
        u.first_name,
        u.last_name,
        u.email,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = lm.other_user_id 
         AND receiver_id = $1 
         AND is_read = false
         AND is_deleted_by_receiver = false) as unread_count
      FROM latest_messages lm
      JOIN users u ON u.id = lm.other_user_id
      ORDER BY lm.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      conversations: result.rows
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// Get messages with a specific user
export const getConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { userId: otherUserId } = req.params;
    
    // Check if users are friends
    const friendCheck = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
       AND status = 'accepted'`,
      [userId, otherUserId]
    );
    
    if (friendCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only message friends' 
      });
    }
    
    // Get messages
    const messages = await pool.query(
      `SELECT 
        m.*,
        sender.first_name as sender_first_name,
        sender.last_name as sender_last_name,
        receiver.first_name as receiver_first_name,
        receiver.last_name as receiver_last_name,
        tbt.id as transaction_id,
        tbt.status as transaction_status,
        tbs.title as skill_title
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      LEFT JOIN time_bank_transactions tbt ON m.related_transaction_id = tbt.id
      LEFT JOIN time_bank_skills tbs ON tbt.skill_id = tbs.id
      WHERE ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1))
        AND NOT (m.sender_id = $1 AND m.is_deleted_by_sender = true)
        AND NOT (m.receiver_id = $1 AND m.is_deleted_by_receiver = true)
      ORDER BY m.created_at ASC`,
      [userId, otherUserId]
    );
    
    // Mark messages as read
    await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE sender_id = $2 AND receiver_id = $1 AND is_read = false`,
      [userId, otherUserId]
    );
    
    // Get other user info
    const userInfo = await pool.query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
      [otherUserId]
    );
    
    res.json({
      success: true,
      messages: messages.rows,
      otherUser: userInfo.rows[0]
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
  }
};

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.userId;
    const { receiver_id, content, related_transaction_id } = req.body;
    
    // Check if users are friends
    const friendCheck = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
       AND status = 'accepted'`,
      [senderId, receiver_id]
    );
    
    if (friendCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only message friends' 
      });
    }
    
    // Create message
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, related_transaction_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [senderId, receiver_id, content, related_transaction_id || null]
    );
    
    // Get sender info for response
    const senderInfo = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [senderId]
    );
    
    res.json({
      success: true,
      message: {
        ...result.rows[0],
        sender_first_name: senderInfo.rows[0].first_name,
        sender_last_name: senderInfo.rows[0].last_name
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Mark message as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { messageId } = req.params;
    
    const result = await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [messageId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.json({
      success: true,
      message: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark message as read' });
  }
};

// Delete message (soft delete)
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { messageId } = req.params;
    
    // Check if user is sender or receiver
    const messageCheck = await pool.query(
      'SELECT sender_id, receiver_id FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    const message = messageCheck.rows[0];
    let updateQuery;
    
    if (message.sender_id === userId) {
      updateQuery = 'UPDATE messages SET is_deleted_by_sender = true WHERE id = $1 RETURNING *';
    } else if (message.receiver_id === userId) {
      updateQuery = 'UPDATE messages SET is_deleted_by_receiver = true WHERE id = $1 RETURNING *';
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const result = await pool.query(updateQuery, [messageId]);
    
    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};