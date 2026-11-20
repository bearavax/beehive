import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, referralCode } = req.body;
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create user
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, points',
        [email, passwordHash, firstName, lastName]
      );
      
      const newUser = userResult.rows[0];
      
      // Handle referral if provided
      if (referralCode) {
        const referrerResult = await client.query('SELECT id FROM users WHERE id = $1', [referralCode]);
        
        if (referrerResult.rows.length > 0) {
          const referrerId = referrerResult.rows[0].id;
          
          // Add referral record
          await client.query(
            'INSERT INTO user_referrals (referrer_id, referred_id) VALUES ($1, $2)',
            [referrerId, newUser.id]
          );
          
          // Award points to referrer
          await client.query(
            'UPDATE users SET points = points + 5 WHERE id = $1',
            [referrerId]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          points: newUser.points
        },
        token
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const userResult = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, points, vote_streak FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        points: user.points,
        voteStreak: user.vote_streak
      },
      token
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const userResult = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.points, u.vote_streak, u.last_vote_date,
             COUNT(dv.id) as total_votes,
             COUNT(DISTINCT dv.vote_date) as voting_days
      FROM users u
      LEFT JOIN daily_votes dv ON u.id = dv.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      points: user.points,
      voteStreak: user.vote_streak,
      lastVoteDate: user.last_vote_date,
      totalVotes: parseInt(user.total_votes),
      votingDays: parseInt(user.voting_days)
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};