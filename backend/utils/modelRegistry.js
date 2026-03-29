/**
 * Active AI Models Configuration
 * Last Updated: March 27, 2026
 * 
 * This file maintains a list of currently supported models across all AI providers.
 * Update this file when models are deprecated or new ones become available.
 */

export const ACTIVE_MODELS = {
  custom: {
    primary: 'CustomQuizModel-v1.0',
    alternatives: [],
    description: 'In-house NLP quiz generator with LLM fine-tuning layer (no API key required)',
    docs: 'backend/utils/customQuizModel.js',
    capabilities: ['standalone', 'fine-tuning', 'distillation'],
    requiresApiKey: false,
  },

  groq: {
    primary: 'llama-3.3-70b-versatile',
    alternatives: [
      'llama-3.1-8b-instant',
      'llama3-70b-8192',
      'mixtral-8x7b-32768',
    ],
    description: 'Fast, reliable LLM API',
    docs: 'https://console.groq.com/docs/models',
  },
  
  gemini: {
    primary: 'gemini-2.0-flash',
    alternatives: [
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      // Failed models (removed):
      // 'gemini-3.1-flash-lite-preview', // Not found - removed 2026-03-27
      // 'gemini-3-flash-preview',
    ],
    description: 'Google\'s generative model API (requires billing)',
    docs: 'https://ai.google.dev/models',
  },
  
  ollama: {
    primary: 'mistral',
    alternatives: [
      'llama2',
      'neural-chat',
      'dolphin-mixtral',
      'orca-mini',
    ],
    description: 'Local models (requires Ollama running locally)',
    docs: 'https://ollama.ai',
    setup: 'ollama serve && ollama pull mistral',
  },
};

export function getModelInfo(provider) {
  return ACTIVE_MODELS[provider];
}

export function getPrimaryModel(provider) {
  return ACTIVE_MODELS[provider]?.primary;
}

export function listAvailableModels(provider) {
  const info = ACTIVE_MODELS[provider];
  if (!info) return [];
  return [info.primary, ...info.alternatives];
}

export const MODEL_DEPRECATION_LOG = [
  {
    date: '2026-03-27',
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    reason: 'Model decommissioned by Groq',
    replacement: 'llama-3.3-70b-versatile',
    status: 'REMOVED FROM ACTIVE USE',
  },
  {
    date: '2026-03-27',
    provider: 'gemini',
    model: 'gemini-3.1-flash-lite-preview',
    reason: 'Model not found / not supported for generateContent',
    replacement: 'gemini-1.5-flash',
    status: 'REMOVED FROM ACTIVE USE',
  },
];

export function getDeprecationInfo(provider, model) {
  return MODEL_DEPRECATION_LOG.find(log => 
    log.provider === provider && log.model === model
  );
}
