import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get leaderboard
router.get('/leaderboard', (req, res) => {
  res.json({ message: 'Leaderboard endpoint - coming soon' });
});

// Get user's impact
router.get('/impact', authenticateToken, (req, res) => {
  res.json({ message: 'User impact endpoint - coming soon' });
});

module.exports = router;