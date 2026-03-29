/**
 * AI Model Routes
 * ────────────────
 * API endpoints for AI-powered MCQ generation and analysis.
 * Includes dedicated routes for the custom in-house quiz model.
 */

import express from 'express';
import * as aiModelController from '../controllers/aiModelController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ─── Service Init ─────────────────────────────────────────────────────────────
router.post('/init', aiModelController.initializeAI);

// ─── Standard MCQ Generation (uses orchestrator → custom → fallback) ──────────
router.post('/generate-mcqs',           authMiddleware, aiModelController.generateMCQs);
router.post('/generate-mcqs-from-file', authMiddleware, aiModelController.generateMCQsFromFile);

// ─── Custom In-House Model (direct access) ────────────────────────────────────
// POST /api/ai/custom/generate  — generate with fine-tuning control
router.post('/custom/generate', authMiddleware, aiModelController.generateWithCustomModel);

// GET  /api/ai/custom/info      — model metadata & capabilities
router.get('/custom/info', aiModelController.getCustomModelInfo);

// ─── Answer Analysis ──────────────────────────────────────────────────────────
router.post('/analyze-answers', authMiddleware, aiModelController.analyzeAnswers);

// ─── Provider Management ──────────────────────────────────────────────────────
router.get('/providers',        aiModelController.getProviders);
router.post('/switch-provider', authMiddleware, aiModelController.switchProvider);
router.get('/status',           aiModelController.getStatus);

export default router;
