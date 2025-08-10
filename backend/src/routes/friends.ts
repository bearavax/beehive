import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
  getPendingRequests,
  removeFriend,
  connectViaQR,
  getFriendshipStatus
} from '../controllers/friendsController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Friend management
router.post('/add', sendFriendRequest);
router.put('/accept/:requestId', acceptFriendRequest);
router.put('/reject/:requestId', rejectFriendRequest);
router.get('/list', getFriendsList);
router.get('/pending', getPendingRequests);
router.delete('/remove/:friendId', removeFriend);
router.get('/status/:userId', getFriendshipStatus);

// QR code connection
router.post('/qr-connect', connectViaQR);

export default router;