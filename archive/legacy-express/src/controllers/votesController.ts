import { Request, Response } from 'express';
import pool from '../database/connection';

export const getDailyVote = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user?.id; // User ID from auth token if present
    
    // Get today's category (rotate categories daily)
    const categoryResult = await pool.query(`
      SELECT * FROM categories 
      WHERE is_active = true 
      ORDER BY (EXTRACT(DOY FROM CURRENT_DATE) + id) % (SELECT COUNT(*) FROM categories WHERE is_active = true)
      LIMIT 1
    `);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active categories found' });
    }
    
    const category = categoryResult.rows[0];
    
    // Get 5 random options for today's category
    const optionsResult = await pool.query(`
      SELECT * FROM vote_options 
      WHERE category_id = $1 AND is_active = true 
      ORDER BY RANDOM() 
      LIMIT 5
    `, [category.id]);
    
    // Check if user has already voted today (if authenticated)
    let hasVoted = false;
    if (userId) {
      const existingVote = await pool.query(
        'SELECT id FROM daily_votes WHERE user_id = $1 AND vote_date = $2',
        [userId, today]
      );
      hasVoted = existingVote.rows.length > 0;
    }
    
    res.json({
      success: true,
      category,
      options: optionsResult.rows,
      hasVoted,
      voteDate: today
    });
  } catch (error) {
    console.error('Error fetching daily vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitVote = async (req: Request, res: Response) => {
  try {
    const { selectedOptionId } = req.body;
    const userId = req.user?.id;
    const today = new Date().toISOString().split('T')[0];
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get the category ID from the selected option
    const optionResult = await pool.query(
      'SELECT category_id FROM vote_options WHERE id = $1',
      [selectedOptionId]
    );
    
    if (optionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid option selected' });
    }
    
    const categoryId = optionResult.rows[0].category_id;
    
    // Check if user already voted today
    const existingVote = await pool.query(
      'SELECT id FROM daily_votes WHERE user_id = $1 AND vote_date = $2',
      [userId, today]
    );
    
    if (existingVote.rows.length > 0) {
      return res.status(400).json({ error: 'You have already voted today' });
    }
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert vote
      await client.query(
        'INSERT INTO daily_votes (user_id, category_id, selected_option_id, vote_date) VALUES ($1, $2, $3, $4)',
        [userId, categoryId, selectedOptionId, today]
      );
      
      // Update user points and streak
      const userResult = await client.query(
        'SELECT vote_streak, last_vote_date FROM users WHERE id = $1',
        [userId]
      );
      
      const user = userResult.rows[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = 1;
      if (user.last_vote_date === yesterdayStr) {
        newStreak = user.vote_streak + 1;
      }
      
      const pointsEarned = 1 + Math.floor(newStreak / 7); // Bonus points for weekly streaks
      
      await client.query(
        'UPDATE users SET points = points + $1, vote_streak = $2, last_vote_date = $3 WHERE id = $4',
        [pointsEarned, newStreak, today, userId]
      );
      
      // Update vote option count
      await client.query(
        'UPDATE vote_options SET vote_count = vote_count + 1 WHERE id = $1',
        [selectedOptionId]
      );
      
      // Update Elo ratings for all options in this category
      const categoryOptionsResult = await client.query(
        'SELECT id, elo_rating FROM vote_options WHERE category_id = $1 AND is_active = true',
        [categoryId]
      );
      
      const { processVoteEloUpdate } = require('../utils/eloRating');
      const ratingUpdates = processVoteEloUpdate(selectedOptionId, categoryOptionsResult.rows);
      
      // Apply rating updates
      for (const update of ratingUpdates) {
        await client.query(
          'UPDATE vote_options SET elo_rating = $1 WHERE id = $2',
          [update.newRating, update.id]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        pointsEarned,
        newStreak,
        message: `Vote submitted! You earned ${pointsEarned} points.`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVoteResults = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    
    // Get category info
    const categoryResult = await pool.query(`
      SELECT * FROM categories WHERE id = $1
    `, [categoryId]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const category = categoryResult.rows[0];
    
    // Get results with rankings
    const results = await pool.query(`
      SELECT vo.*, 
             COUNT(dv.id) as vote_count,
             RANK() OVER (ORDER BY vo.elo_rating DESC) as current_rank
      FROM vote_options vo
      LEFT JOIN daily_votes dv ON vo.id = dv.selected_option_id
      WHERE vo.category_id = $1 AND vo.is_active = true
      GROUP BY vo.id
      ORDER BY vo.elo_rating DESC
    `, [categoryId]);
    
    res.json({
      success: true,
      category,
      results: results.rows
    });
  } catch (error) {
    console.error('Error fetching vote results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTrendingOptions = async (req: Request, res: Response) => {
  try {
    const results = await pool.query(`
      SELECT vo.*, c.name as category_name,
             COUNT(dv.id) as recent_votes
      FROM vote_options vo
      JOIN categories c ON vo.category_id = c.id
      LEFT JOIN daily_votes dv ON vo.id = dv.selected_option_id 
      WHERE dv.created_at > NOW() - INTERVAL '7 days'
      GROUP BY vo.id, c.name
      ORDER BY recent_votes DESC
      LIMIT 10
    `);
    
    res.json(results.rows);
  } catch (error) {
    console.error('Error fetching trending options:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserVoteHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit as string) || 30;
    const today = new Date().toISOString().split('T')[0];

    const results = await pool.query(`
      SELECT dv.vote_date, 
             dv.created_at,
             c.name as category_name,
             c.description as category_description,
             c.id as category_id,
             vo.name as option_name,
             vo.description as option_description,
             vo.elo_rating,
             CASE WHEN dv.vote_date = $2 THEN true ELSE false END as is_today
      FROM daily_votes dv
      JOIN categories c ON dv.category_id = c.id
      JOIN vote_options vo ON dv.selected_option_id = vo.id
      WHERE dv.user_id = $1
      ORDER BY dv.vote_date DESC, dv.created_at DESC
      LIMIT $3
    `, [userId, today, limit]);

    res.json({
      success: true,
      votes: results.rows,
      todayVote: results.rows.find(vote => vote.is_today) || null
    });
  } catch (error) {
    console.error('Error fetching user vote history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const results = await pool.query(`
      SELECT c.*, COUNT(vo.id) as option_count
      FROM categories c
      LEFT JOIN vote_options vo ON c.id = vo.category_id AND vo.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json({
      success: true,
      categories: results.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};