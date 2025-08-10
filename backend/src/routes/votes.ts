import express from 'express';
import { getDailyVote, submitVote, getVoteResults, getTrendingOptions, getUserVoteHistory, getAllCategories } from '../controllers/votesController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get today's daily vote (with optional authentication to check if user has voted)
router.get('/daily', authenticateToken, getDailyVote);

// Submit a vote (requires authentication)
router.post('/submit', authenticateToken, submitVote);

// Get all categories
router.get('/categories', getAllCategories);

// Get results for a category
router.get('/results/:categoryId', getVoteResults);

// Get trending options
router.get('/trending', getTrendingOptions);

// Get user's voting history (requires authentication)
router.get('/history', authenticateToken, getUserVoteHistory);

module.exports = router;