import express from 'express';
import { getProviderStatus, resetProviderCache } from '../utils/aiOrchestrator.js';

const router = express.Router();

// Check AI provider status and availability
router.get('/ai-providers', (req, res) => {
  const status = getProviderStatus();
  res.json({
    message: 'AI Provider Status',
    ...status,
    timestamp: new Date().toISOString(),
  });
});

// Reset provider cache
router.post('/ai-providers/reset', (req, res) => {
  resetProviderCache();
  res.json({
    message: 'Provider cache reset successfully',
    status: getProviderStatus(),
  });
});

export default router;
