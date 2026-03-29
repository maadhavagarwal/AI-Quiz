/**
 * Model Configuration Manager
 * Allows easy switching between different AI models and providers
 */

// Model Presets by Provider
export const MODEL_PRESETS = {
  custom: {
    'CustomQuizModel-v1.0': {
      name:           'CustomQuizModel-v1.0',
      type:           'custom',
      description:    'In-house NLP quiz generator with distillation + LLM fine-tuning layer',
      speed:          'Ultra-fast (<0.1s standalone, 5-15s with fine-tuning)',
      quality:        'Good (standalone) → Excellent (fine-tuned)',
      requiresApiKey: false,
      recommended:    true,
      capabilities:   ['Standalone NLP', 'LLM fine-tuning', 'Distillation guidance', 'Difficulty-aware'],
    },
  },

  ollama: {
    llama2: {
      name: 'llama2',
      type: 'ollama',
      description: 'Stable, reliable, best for MCQs',
      size: '4GB',
      speed: 'Medium (2-3s)',
      quality: 'Excellent',
      recommended: true,
    },
    mistral: {
      name: 'mistral',
      type: 'ollama',
      description: 'Faster, lightweight',
      size: '3GB',
      speed: 'Fast (1-2s)',
      quality: 'Good',
    },
    'neural-chat': {
      name: 'neural-chat',
      type: 'ollama',
      description: 'Good for conversational MCQs',
      size: '2GB',
      speed: 'Fast (1-2s)',
      quality: 'Good',
    },
    'dolphin-mixtral': {
      name: 'dolphin-mixtral',
      type: 'ollama',
      description: 'Most capable, best quality',
      size: '5GB',
      speed: 'Slower (3-5s)',
      quality: 'Excellent',
    },
    'orca-mini': {
      name: 'orca-mini',
      type: 'ollama',
      description: 'Lightweight, good for basic MCQs',
      size: '1GB',
      speed: 'Very fast (<1s)',
      quality: 'Fair',
    },
  },
  groq: {
    'llama-3.2-90b-text-preview': {
      name: 'llama-3.2-90b-text-preview',
      type: 'groq',
      description: 'Latest Groq model (subject to deprecation)',
      speed: 'Fast (2-5s)',
      quality: 'Excellent',
      warning: 'May be decommissioned',
    },
  },
  gemini: {
    'gemini-1.5-flash': {
      name: 'gemini-1.5-flash',
      type: 'gemini',
      description: 'Google Gemini Flash (free tier)',
      speed: 'Fast (2-4s)',
      quality: 'Excellent',
      warning: 'Requires billing enabled',
    },
  },
};

export function getModel(provider, modelName) {
  const presets = MODEL_PRESETS[provider];
  if (!presets) {
    return null;
  }
  return presets[modelName] || Object.values(presets)[0];
}

export function listModels(provider) {
  const presets = MODEL_PRESETS[provider];
  if (!presets) {
    return [];
  }
  return Object.values(presets);
}

export function listAllModels() {
  const all = [];
  for (const provider in MODEL_PRESETS) {
    const models = listModels(provider);
    all.push(...models.map(m => ({ ...m, provider })));
  }
  return all;
}

export function getRecommendedModel(provider) {
  const presets = MODEL_PRESETS[provider];
  if (!presets) {
    return null;
  }
  for (const model of Object.values(presets)) {
    if (model.recommended) {
      return model;
    }
  }
  return Object.values(presets)[0];
}

export function selectModel(userPreference = null) {
  // If user specified a model, use it
  if (userPreference) {
    for (const provider in MODEL_PRESETS) {
      const model = getModel(provider, userPreference);
      if (model) {
        return model;
      }
    }
  }

  // Default: Use Ollama llama2 if available
  const ollamaLlama2 = getModel('ollama', 'llama2');
  if (ollamaLlama2) {
    return ollamaLlama2;
  }

  // Fallback to first available model
  return listAllModels()[0];
}

export function formatModelInfo(model) {
  return `
Model: ${model.name}
Provider: ${model.type}
Description: ${model.description}
Speed: ${model.speed}
Quality: ${model.quality}
${model.size ? `Size: ${model.size}` : ''}
${model.warning ? `⚠️  Warning: ${model.warning}` : ''}
  `.trim();
}
