import { Request, Response } from 'express';
import pool from '../database/db';
import crypto from 'crypto';

// Send friend request
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { friend_id, note } = req.body;
    
    if (userId === friend_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }
    
    // Check if friendship already exists
    const existingCheck = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))`,
      [Math.min(userId, friend_id), Math.max(userId, friend_id)]
    );
    
    if (existingCheck.rows.length > 0) {
      const friendship = existingCheck.rows[0];
      if (friendship.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Already friends'
        });
      } else if (friendship.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Friend request already pending'
        });
      }
    }
    
    // Create friend request
    const result = await pool.query(
      `INSERT INTO friendships (user1_id, user2_id, status, connection_note)
       VALUES ($1, $2, 'pending', $3)
       ON CONFLICT (user1_id, user2_id) 
       DO UPDATE SET status = 'pending', connection_note = $3
       RETURNING *`,
      [Math.min(userId, friend_id), Math.max(userId, friend_id), note]
    );
    
    res.json({
      success: true,
      friendship: result.rows[0]
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ success: false, message: 'Failed to send friend request' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { requestId } = req.params;
    
    const result = await pool.query(
      `UPDATE friendships 
       SET status = 'accepted'
       WHERE id = $1 
       AND (user1_id = $2 OR user2_id = $2)
       AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }
    
    res.json({
      success: true,
      friendship: result.rows[0]
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ success: false, message: 'Failed to accept friend request' });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { requestId } = req.params;
    
    const result = await pool.query(
      `UPDATE friendships 
       SET status = 'rejected'
       WHERE id = $1 
       AND (user1_id = $2 OR user2_id = $2)
       AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Friend request rejected'
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ success: false, message: 'Failed to reject friend request' });
  }
};

// Get friends list
export const getFriendsList = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const result = await pool.query(
      `SELECT 
        f.*,
        CASE 
          WHEN f.user1_id = $1 THEN u2.id
          ELSE u1.id
        END as friend_id,
        CASE 
          WHEN f.user1_id = $1 THEN u2.first_name
          ELSE u1.first_name
        END as friend_first_name,
        CASE 
          WHEN f.user1_id = $1 THEN u2.last_name
          ELSE u1.last_name
        END as friend_last_name,
        CASE 
          WHEN f.user1_id = $1 THEN u2.email
          ELSE u1.email
        END as friend_email,
        CASE 
          WHEN f.user1_id = $1 THEN u2.points
          ELSE u1.points
        END as friend_points
      FROM friendships f
      JOIN users u1 ON f.user1_id = u1.id
      JOIN users u2 ON f.user2_id = u2.id
      WHERE (f.user1_id = $1 OR f.user2_id = $1)
      AND f.status = 'accepted'
      ORDER BY f.created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      friends: result.rows
    });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch friends' });
  }
};

// Get pending friend requests
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Get incoming requests
    const incomingResult = await pool.query(
      `SELECT 
        f.*,
        CASE 
          WHEN f.user1_id = $1 THEN u2.id
          ELSE u1.id
        END as requester_id,
        CASE 
          WHEN f.user1_id = $1 THEN u2.first_name
          ELSE u1.first_name
        END as requester_first_name,
        CASE 
          WHEN f.user1_id = $1 THEN u2.last_name
          ELSE u1.last_name
        END as requester_last_name,
        CASE 
          WHEN f.user1_id = $1 THEN u2.email
          ELSE u1.email
        END as requester_email
      FROM friendships f
      JOIN users u1 ON f.user1_id = u1.id
      JOIN users u2 ON f.user2_id = u2.id
      WHERE (f.user2_id = $1)
      AND f.status = 'pending'
      ORDER BY f.created_at DESC`,
      [userId]
    );
    
    // Get outgoing requests
    const outgoingResult = await pool.query(
      `SELECT 
        f.*,
        CASE 
          WHEN f.user1_id = $1 THEN u2.id
          ELSE u1.id
        END as requested_id,
        CASE 
          WHEN f.user1_id = $1 THEN u2.first_name
          ELSE u1.first_name
        END as requested_first_name,
        CASE 
          WHEN f.user1_id = $1 THEN u2.last_name
          ELSE u1.last_name
        END as requested_last_name,
        CASE 
          WHEN f.user1_id = $1 THEN u2.email
          ELSE u1.email
        END as requested_email
      FROM friendships f
      JOIN users u1 ON f.user1_id = u1.id
      JOIN users u2 ON f.user2_id = u2.id
      WHERE (f.user1_id = $1)
      AND f.status = 'pending'
      ORDER BY f.created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      incoming: incomingResult.rows,
      outgoing: outgoingResult.rows
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending requests' });
  }
};

// Remove friend
export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { friendId } = req.params;
    
    const result = await pool.query(
      `UPDATE friendships 
       SET status = 'removed'
       WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
       AND status = 'accepted'
       RETURNING *`,
      [Math.min(userId, parseInt(friendId)), Math.max(userId, parseInt(friendId))]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Friend removed'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
};

// Connect via QR code
export const connectViaQR = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { qr_code } = req.body;
    
    // Parse QR code to get friend ID
    // QR format: "beehive:friend:{userId}:{timestamp}:{hash}"
    const parts = qr_code.split(':');
    if (parts.length !== 5 || parts[0] !== 'beehive' || parts[1] !== 'friend') {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }
    
    const friendId = parseInt(parts[2]);
    const timestamp = parseInt(parts[3]);
    const hash = parts[4];
    
    // Verify QR code is recent (within 5 minutes)
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'QR code has expired'
      });
    }
    
    // Verify hash
    const expectedHash = crypto
      .createHash('sha256')
      .update(`beehive:friend:${friendId}:${timestamp}:${process.env.JWT_SECRET || 'default-secret'}`)
      .digest('hex')
      .substring(0, 8);
    
    if (hash !== expectedHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code'
      });
    }
    
    if (userId === friendId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot connect with yourself'
      });
    }
    
    // Create or update friendship (auto-accept for QR connections)
    const result = await pool.query(
      `INSERT INTO friendships (user1_id, user2_id, status, connection_note)
       VALUES ($1, $2, 'accepted', 'Connected via QR code')
       ON CONFLICT (user1_id, user2_id) 
       DO UPDATE SET status = 'accepted', connection_note = 'Reconnected via QR code'
       RETURNING *`,
      [Math.min(userId, friendId), Math.max(userId, friendId)]
    );
    
    // Get friend info
    const friendInfo = await pool.query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
      [friendId]
    );
    
    res.json({
      success: true,
      friendship: result.rows[0],
      friend: friendInfo.rows[0]
    });
  } catch (error) {
    console.error('Error connecting via QR:', error);
    res.status(500).json({ success: false, message: 'Failed to connect via QR code' });
  }
};

// Get friendship status with specific user
export const getFriendshipStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { userId: otherUserId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))`,
      [Math.min(userId, parseInt(otherUserId)), Math.max(userId, parseInt(otherUserId))]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        status: 'none'
      });
    }
    
    res.json({
      success: true,
      status: result.rows[0].status,
      friendship: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting friendship status:', error);
    res.status(500).json({ success: false, message: 'Failed to get friendship status' });
  }
};