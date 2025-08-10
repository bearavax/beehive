import express from 'express';
import { 
  getRewards, 
  redeemReward, 
  getUserRedemptions, 
  validateRedemption, 
  markRedemptionUsed 
} from '../controllers/partnersController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all rewards
router.get('/rewards', getRewards);

// Redeem reward (requires authentication)
router.post('/redeem', authenticateToken, redeemReward);

// Get user's redemption history (requires authentication)
router.get('/redemptions', authenticateToken, getUserRedemptions);

// Validate redemption code (for partners)
router.post('/validate', validateRedemption);

// Mark redemption as used (for partners)
router.post('/mark-used', markRedemptionUsed);

module.exports = router;