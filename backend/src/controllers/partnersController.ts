import { Request, Response } from 'express';
import pool from '../database/connection';
import { randomBytes } from 'crypto';

export const getRewards = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*, p.name as partner_name, p.business_type
      FROM rewards r
      JOIN partners p ON r.partner_id = p.id
      WHERE r.is_active = true AND p.is_active = true
      ORDER BY r.point_cost ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const redeemReward = async (req: Request, res: Response) => {
  try {
    const { rewardId } = req.body;
    const userId = (req as any).user.userId;
    
    // Get user's current points
    const userResult = await pool.query('SELECT points FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userPoints = userResult.rows[0].points;
    
    // Get reward details
    const rewardResult = await pool.query(`
      SELECT r.*, p.name as partner_name
      FROM rewards r
      JOIN partners p ON r.partner_id = p.id
      WHERE r.id = $1 AND r.is_active = true AND p.is_active = true
    `, [rewardId]);
    
    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found or inactive' });
    }
    
    const reward = rewardResult.rows[0];
    
    // Check if user has enough points
    if (userPoints < reward.point_cost) {
      return res.status(400).json({ 
        error: `Insufficient points. You have ${userPoints}, need ${reward.point_cost}` 
      });
    }
    
    // Check reward availability
    if (reward.quantity_available !== null && reward.quantity_available <= 0) {
      return res.status(400).json({ error: 'Reward is out of stock' });
    }
    
    // Generate redemption code
    const redemptionCode = randomBytes(4).toString('hex').toUpperCase();
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Deduct points from user
      await client.query(
        'UPDATE users SET points = points - $1 WHERE id = $2',
        [reward.point_cost, userId]
      );
      
      // Create redemption record
      await client.query(`
        INSERT INTO reward_redemptions (user_id, reward_id, redemption_code)
        VALUES ($1, $2, $3)
      `, [userId, rewardId, redemptionCode]);
      
      // Update reward quantity if limited
      if (reward.quantity_available !== null) {
        await client.query(
          'UPDATE rewards SET quantity_available = quantity_available - 1 WHERE id = $1',
          [rewardId]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Reward redeemed successfully!`,
        redemptionCode,
        reward: {
          title: reward.title,
          partner: reward.partner_name,
          pointsUsed: reward.point_cost
        },
        remainingPoints: userPoints - reward.point_cost
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserRedemptions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const result = await pool.query(`
      SELECT rr.*, r.title, r.description, p.name as partner_name
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      JOIN partners p ON r.partner_id = p.id
      WHERE rr.user_id = $1
      ORDER BY rr.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user redemptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateRedemption = async (req: Request, res: Response) => {
  try {
    const { redemptionCode } = req.body;
    
    const result = await pool.query(`
      SELECT rr.*, r.title, r.description, u.first_name, u.last_name, p.name as partner_name
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      JOIN users u ON rr.user_id = u.id
      JOIN partners p ON r.partner_id = p.id
      WHERE rr.redemption_code = $1 AND rr.is_redeemed = false
    `, [redemptionCode]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid redemption code or already used' });
    }
    
    const redemption = result.rows[0];
    
    res.json({
      valid: true,
      redemption: {
        id: redemption.id,
        code: redemption.redemption_code,
        reward: redemption.title,
        description: redemption.description,
        partner: redemption.partner_name,
        customer: `${redemption.first_name} ${redemption.last_name}`,
        createdAt: redemption.created_at
      }
    });
  } catch (error) {
    console.error('Error validating redemption:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markRedemptionUsed = async (req: Request, res: Response) => {
  try {
    const { redemptionCode } = req.body;
    
    const result = await pool.query(`
      UPDATE reward_redemptions 
      SET is_redeemed = true, redeemed_at = CURRENT_TIMESTAMP
      WHERE redemption_code = $1 AND is_redeemed = false
      RETURNING id
    `, [redemptionCode]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid redemption code or already used' });
    }
    
    res.json({ success: true, message: 'Redemption marked as used' });
  } catch (error) {
    console.error('Error marking redemption as used:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};