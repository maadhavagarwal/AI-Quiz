/**
 * AI Model Routes - API endpoints for AI-powered MCQ generation and analysis
 */

import express from 'express';
import * as aiModelController from '../controllers/aiModelController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Initialize AI Model Service
router.post('/init', aiModelController.initializeAI);

// Generate MCQs from text
router.post('/generate-mcqs', authMiddleware, aiModelController.generateMCQs);

// Generate MCQs from uploaded file
router.post('/generate-mcqs-from-file', authMiddleware, aiModelController.generateMCQsFromFile);

// Analyze quiz answers
router.post('/analyze-answers', authMiddleware, aiModelController.analyzeAnswers);

// Get available AI providers
router.get('/providers', aiModelController.getProviders);

// Switch AI provider
router.post('/switch-provider', authMiddleware, aiModelController.switchProvider);

// Get AI model status
router.get('/status', aiModelController.getStatus);

export default router;
