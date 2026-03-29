/**
 * Simplified AI Service Selection
 * Strategy: Use LOCAL Ollama as PRIMARY
 * Cloud APIs only if Ollama unavailable
 */

import * as ollamaService from './ollamaService.js';
import * as groqService from './groqService.js';
import * as geminiService from './geminiService.js';
import { generateLocalMCQsFromText } from './localMcqFallback.js';

// PRIORITY ORDER (Ollama first, not last!)
const PROVIDER_PRIORITY = [
  'ollama',   // PRIMARY - Local, stable, forever
  'groq',     // Secondary - Cloud, but API changes
  'gemini',   // Backup - Cloud, expensive
];

export async function generateMCQsWithFallback(text, numberOfQuestions = 5, context = {}) {
  console.log(`\n[MCQGenerator] Generating ${numberOfQuestions} MCQs...`);
  console.log(`[MCQGenerator] Provider order: ${PROVIDER_PRIORITY.join(' → ')}`);
  
  const errors = [];

  for (const provider of PROVIDER_PRIORITY) {
    try {
      console.log(`[MCQGenerator] Trying ${provider}...`);
      
      let result;
      if (provider === 'ollama') {
        result = await ollamaService.generateMCQsFromText(text, numberOfQuestions, context);
      } else if (provider === 'groq') {
        result = await groqService.generateMCQsFromText(text, numberOfQuestions, context);
      } else if (provider === 'gemini') {
        result = await geminiService.generateMCQsFromText(text, numberOfQuestions, context);
      }

      if (result && result.length > 0) {
        console.log(`[MCQGenerator] ✅ ${provider} succeeded with ${result.length} questions`);
        
        return {
          questions: result.map(q => ({ ...q, generatedBy: provider })),
          provider,
          fallbackUsed: provider !== 'ollama',
          message: provider === 'ollama' 
            ? 'Generated locally (Ollama)' 
            : `Generated via cloud (${provider}) - Ollama not available`,
        };
      }
    } catch (error) {
      const errorMsg = error.message || String(error);
      errors.push({ provider, error: errorMsg });
      console.log(`[MCQGenerator] ❌ ${provider} failed: ${errorMsg.substring(0, 80)}`);
    }
  }

  // All providers failed; use deterministic local fallback generator.
  const fullErrors = errors.map(e => `${e.provider}: ${e.error}`).join(' | ');
  console.warn(`[MCQGenerator] Falling back to local heuristic generator. Errors: ${fullErrors}`);

  const fallbackQuestions = generateLocalMCQsFromText(text, numberOfQuestions);
  return {
    questions: fallbackQuestions.map((q) => ({ ...q, generatedBy: 'manual' })),
    provider: 'manual',
    fallbackUsed: true,
    message: 'Generated with local fallback because external AI providers were unavailable.',
    errors,
  };
}

export async function generateMCQsMixed(text, numberOfQuestions = 5, context = {}) {
  /**
   * Try to get questions from multiple providers
   */
  const results = [];
  const successfulProviders = [];

  for (const provider of PROVIDER_PRIORITY) {
    try {
      const questionsPerProvider = Math.ceil(numberOfQuestions / 2);
      let result;

      if (provider === 'ollama') {
        result = await ollamaService.generateMCQsFromText(text, questionsPerProvider, context);
      } else if (provider === 'groq') {
        result = await groqService.generateMCQsFromText(text, questionsPerProvider, context);
      } else if (provider === 'gemini') {
        result = await geminiService.generateMCQsFromText(text, questionsPerProvider, context);
      }

      if (result && result.length > 0) {
        result = result.map(q => ({ ...q, generatedBy: provider }));
        results.push(...result);
        successfulProviders.push(provider);
        console.log(`[MCQGenerator] Got ${result.length} from ${provider}`);

        if (results.length >= numberOfQuestions) {
          results.splice(numberOfQuestions);
          break;
        }
      }
    } catch (error) {
      console.log(`[MCQGenerator] ${provider} not available for mixed mode`);
    }
  }

  if (results.length === 0) {
    const fallbackQuestions = generateLocalMCQsFromText(text, numberOfQuestions)
      .map((q) => ({ ...q, generatedBy: 'manual' }));

    return {
      questions: fallbackQuestions,
      providers: ['manual'],
      mixed: false,
      primaryIsLocal: true,
      message: 'Mixed generation fallback used due to provider unavailability.',
    };
  }

  return {
    questions: results,
    providers: successfulProviders,
    mixed: successfulProviders.length > 1,
    primaryIsLocal: successfulProviders[0] === 'ollama',
  };
}

export function getProviderStatus() {
  return {
    strategy: 'Local-First (Ollama) + Cloud Fallback',
    primaryProvider: 'ollama',
    priorityOrder: PROVIDER_PRIORITY,
    recommendation: 'For best experience: Install Ollama (https://ollama.ai) and run `ollama serve`',
  };
}
