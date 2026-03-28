import express from 'express';
import { listModels, listAllModels, getModel, formatModelInfo, selectModel } from '../utils/modelConfig.js';

const router = express.Router();

// Get all available models
router.get('/models', (req, res) => {
  try {
    const allModels = listAllModels();
    const grouped = {
      ollama: listModels('ollama'),
      groq: listModels('groq'),
      gemini: listModels('gemini'),
    };

    res.json({
      message: 'Available Models',
      allModels,
      grouped,
      recommendation: 'Use local Ollama for offline reliability, or Groq/Gemini with valid API keys.',
      total: allModels.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get models for specific provider
router.get('/models/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const models = listModels(provider.toLowerCase());

    if (!models || models.length === 0) {
      return res.status(404).json({
        error: `No models found for provider: ${provider}`,
        availableProviders: ['ollama', 'groq', 'gemini'],
      });
    }

    res.json({
      provider,
      models,
      count: models.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific model details
router.get('/models/:provider/:modelName', (req, res) => {
  try {
    const { provider, modelName } = req.params;
    const model = getModel(provider.toLowerCase(), modelName.toLowerCase());

    if (!model) {
      return res.status(404).json({
        error: `Model not found: ${modelName}`,
        provider,
      });
    }

    res.json({
      model,
      info: formatModelInfo(model),
      setup: getSetupInstructions(provider.toLowerCase(), modelName),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommended model for provider
router.get('/recommend/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const recommendedProvider = provider === 'auto' ? 'ollama' : provider.toLowerCase();

    // For Ollama, recommend llama2
    if (recommendedProvider === 'ollama') {
      return res.json({
        message: 'Recommended model for Ollama',
        model: getModel('ollama', 'llama2'),
        reason: 'Best balance of speed, quality, and stability. Local generation is preferred.',
        setup: 'ollama pull llama2',
      });
    }

    res.json({
      message: `Recommended models for ${recommendedProvider}`,
      note: 'Local and cloud models are both supported; ensure API keys and model names are valid.',
      recommendation: getModel(recommendedProvider, Object.keys(listModels(recommendedProvider))[0]),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getSetupInstructions(provider, modelName) {
  const instructions = {
    ollama: {
      common: 'ollama serve',
      install: `ollama pull ${modelName}`,
      test: 'curl http://localhost:11434/api/tags',
    },
    groq: {
      note: 'Requires GROQ_API_KEY in .env.local',
      get_key: 'https://console.groq.com/settings/api-keys',
    },
    gemini: {
      note: 'Requires GEMINI_API_KEY and billing enabled',
      get_key: 'https://ai.google.dev/tutorials/setup',
    },
  };

  return instructions[provider] || { note: 'No setup available' };
}

export default router;
