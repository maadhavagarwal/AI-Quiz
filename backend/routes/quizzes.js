import express from 'express';
import { 
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  publishQuiz 
} from '../controllers/quizController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadMiddleware } from '../utils/uploadHandler.js';

const router = express.Router();

router.post('/', authMiddleware, uploadMiddleware.array('sourceFiles', 10), createQuiz);
router.get('/', authMiddleware, getQuizzes);
router.get('/:id', authMiddleware, getQuizById);
router.put('/:id', authMiddleware, updateQuiz);
router.delete('/:id', authMiddleware, deleteQuiz);
router.post('/:id/publish', authMiddleware, publishQuiz);

export default router;
