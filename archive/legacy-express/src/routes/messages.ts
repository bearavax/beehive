import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  deleteMessage
} from '../controllers/messagesController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all conversations
router.get('/conversations', getConversations);

// Get messages with specific user
router.get('/conversation/:userId', getConversation);

// Send message
router.post('/send', sendMessage);

// Mark message as read
router.put('/read/:messageId', markAsRead);

// Delete message
router.delete('/:messageId', deleteMessage);

export default router;