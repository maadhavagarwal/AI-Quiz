import express from 'express';
import {
  getDashboardAnalytics,
  getQuizPerformance,
  getQuizSubmissions,
  exportResults
} from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/analytics', authMiddleware, getDashboardAnalytics);
router.get('/quizzes/:quizId/performance', authMiddleware, getQuizPerformance);
router.get('/quizzes/:quizId/submissions', authMiddleware, getQuizSubmissions);
router.get('/export', authMiddleware, exportResults);

export default router;
