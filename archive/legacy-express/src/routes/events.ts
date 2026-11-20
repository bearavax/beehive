import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all events
router.get('/', (req, res) => {
  res.json({ message: 'Events endpoint - coming soon' });
});

// Check in to event with QR code
router.post('/checkin', authenticateToken, (req, res) => {
  res.json({ message: 'Event checkin endpoint - coming soon' });
});

module.exports = router;