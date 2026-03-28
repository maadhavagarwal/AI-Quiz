import express from 'express';
import {
  generateQuestions,
  getQuestion,
  updateQuestion,
  approveQuestion,
  deleteQuestion
} from '../controllers/questionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', authMiddleware, generateQuestions);
router.get('/:id', authMiddleware, getQuestion);
router.put('/:id', authMiddleware, updateQuestion);
router.post('/:id/approve', authMiddleware, approveQuestion);
router.delete('/:id', authMiddleware, deleteQuestion);

export default router;
