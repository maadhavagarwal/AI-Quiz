import express from 'express';
import {
  generateTestLink,
  getTest,
  startTest,
  submitResponse,
  submitTest,
  getTestResults,
  getStudentTestResults
} from '../controllers/testController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Specific routes BEFORE generic parameter routes
router.post('/generate-link', authMiddleware, generateTestLink);

// Generic parameter routes
router.get('/:uniqueLink', getTest);
router.post('/:uniqueLink/start', startTest);
router.post('/:testId/submit-response', submitResponse);
router.post('/:testId/submit', submitTest);
router.get('/:testId/results', getTestResults);
router.get('/:testId/teacher-results', authMiddleware, getStudentTestResults);

export default router;
