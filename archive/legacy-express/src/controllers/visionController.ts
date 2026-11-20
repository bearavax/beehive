import { Request, Response } from 'express';
import pool from '../database/db';

// Get today's vision question
export const getDailyVisionQuestion = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = (req as any).user?.userId;
    
    // Get a vision question (rotate daily based on date)
    const questionCountResult = await pool.query(
      'SELECT COUNT(*) FROM vision_questions WHERE is_active = true'
    );
    const questionCount = parseInt(questionCountResult.rows[0].count);
    
    if (questionCount === 0) {
      return res.json({
        success: false,
        message: 'No vision questions available'
      });
    }
    
    // Use date-based rotation to select today's question
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const questionIndex = daysSinceEpoch % questionCount;
    
    // Get the question
    const questionResult = await pool.query(
      `SELECT * FROM vision_questions 
       WHERE is_active = true 
       ORDER BY id 
       LIMIT 1 OFFSET $1`,
      [questionIndex]
    );
    
    const question = questionResult.rows[0];
    
    // Get options for the question
    const optionsResult = await pool.query(
      'SELECT * FROM vision_question_options WHERE question_id = $1 ORDER BY id',
      [question.id]
    );
    
    // Check if user has already answered today
    let hasAnswered = false;
    let userResponse = null;
    
    if (userId) {
      const responseCheck = await pool.query(
        'SELECT * FROM vision_responses WHERE user_id = $1 AND question_id = $2 AND response_date = $3',
        [userId, question.id, today]
      );
      
      if (responseCheck.rows.length > 0) {
        hasAnswered = true;
        userResponse = responseCheck.rows[0];
      }
    }
    
    res.json({
      success: true,
      question: {
        ...question,
        options: optionsResult.rows
      },
      hasAnswered,
      userResponse,
      date: today
    });
  } catch (error) {
    console.error('Error fetching daily vision question:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vision question' });
  }
};

// Submit vision question response
export const submitVisionResponse = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = (req as any).user.userId;
    const { question_id, selected_option_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already responded today
    const existingResponse = await client.query(
      'SELECT * FROM vision_responses WHERE user_id = $1 AND response_date = $2',
      [userId, today]
    );
    
    if (existingResponse.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a vision response today'
      });
    }
    
    // Verify the option belongs to the question
    const optionCheck = await client.query(
      'SELECT * FROM vision_question_options WHERE id = $1 AND question_id = $2',
      [selected_option_id, question_id]
    );
    
    if (optionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Invalid option for this question'
      });
    }
    
    // Create response
    const responseResult = await client.query(
      `INSERT INTO vision_responses (user_id, question_id, selected_option_id, response_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, question_id, selected_option_id, today]
    );
    
    // Increment vote count for the option
    await client.query(
      'UPDATE vision_question_options SET vote_count = vote_count + 1 WHERE id = $1',
      [selected_option_id]
    );
    
    // Increment times asked for the question
    await client.query(
      'UPDATE vision_questions SET times_asked = times_asked + 1 WHERE id = $1',
      [question_id]
    );
    
    // Award points (same as regular voting)
    await client.query(
      'UPDATE users SET points = points + 1 WHERE id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    
    // Get updated results
    const resultsQuery = await client.query(
      `SELECT 
        o.*,
        ROUND((o.vote_count::numeric / NULLIF(SUM(o.vote_count) OVER(), 0) * 100), 1) as percentage
       FROM vision_question_options o
       WHERE o.question_id = $1
       ORDER BY o.vote_count DESC`,
      [question_id]
    );
    
    res.json({
      success: true,
      response: responseResult.rows[0],
      results: resultsQuery.rows,
      pointsAwarded: 1
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting vision response:', error);
    res.status(500).json({ success: false, message: 'Failed to submit response' });
  } finally {
    client.release();
  }
};

// Get vision question results
export const getVisionResults = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    
    // Get question
    const questionResult = await pool.query(
      'SELECT * FROM vision_questions WHERE id = $1',
      [questionId]
    );
    
    if (questionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    // Get options with vote counts and percentages
    const optionsResult = await pool.query(
      `SELECT 
        o.*,
        ROUND((o.vote_count::numeric / NULLIF(SUM(o.vote_count) OVER(), 0) * 100), 1) as percentage
       FROM vision_question_options o
       WHERE o.question_id = $1
       ORDER BY o.vote_count DESC`,
      [questionId]
    );
    
    // Get total responses
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM vision_responses WHERE question_id = $1',
      [questionId]
    );
    
    res.json({
      success: true,
      question: questionResult.rows[0],
      options: optionsResult.rows,
      totalResponses: parseInt(totalResult.rows[0].total)
    });
  } catch (error) {
    console.error('Error fetching vision results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results' });
  }
};

// Get all vision questions (for history/browsing)
export const getAllVisionQuestions = async (req: Request, res: Response) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        q.*,
        COUNT(DISTINCT r.id) as response_count
      FROM vision_questions q
      LEFT JOIN vision_responses r ON q.id = r.question_id
      WHERE q.is_active = true
    `;
    
    const params: any[] = [];
    
    if (category) {
      params.push(category);
      query += ` AND q.category = $${params.length}`;
    }
    
    query += `
      GROUP BY q.id
      ORDER BY q.times_asked DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get options for each question
    const questionsWithOptions = await Promise.all(
      result.rows.map(async (question) => {
        const optionsResult = await pool.query(
          `SELECT 
            o.*,
            ROUND((o.vote_count::numeric / NULLIF(SUM(o.vote_count) OVER(), 0) * 100), 1) as percentage
           FROM vision_question_options o
           WHERE o.question_id = $1
           ORDER BY o.vote_count DESC`,
          [question.id]
        );
        
        return {
          ...question,
          options: optionsResult.rows
        };
      })
    );
    
    res.json({
      success: true,
      questions: questionsWithOptions
    });
  } catch (error) {
    console.error('Error fetching all vision questions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};