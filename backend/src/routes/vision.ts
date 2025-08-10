import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getDailyVisionQuestion,
  submitVisionResponse,
  getVisionResults,
  getAllVisionQuestions
} from '../controllers/visionController';

const router = express.Router();

// Public routes
router.get('/daily', getDailyVisionQuestion);
router.get('/results/:questionId', getVisionResults);
router.get('/all', getAllVisionQuestions);

// Protected routes
router.post('/submit', authenticateToken, submitVisionResponse);

export default router;