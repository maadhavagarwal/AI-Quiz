/**
 * AI Orchestrator
 * ───────────────
 * Coordinates all AI providers including the custom in-house model.
 *
 * Provider order (default): custom → groq → ollama → gemini
 *
 * The CUSTOM provider:
 *  • Runs the in-house NLP quiz model first
 *  • Optionally queries Groq/Gemini in parallel for fine-tuning
 *  • Merges results using semantic matching (fine-tune layer)
 *  • Uses distillation guidance from previously approved questions
 */

import * as groqService    from './groqService.js';
import * as ollamaService  from './ollamaService.js';
import * as geminiService  from './geminiService.js';
import * as customModel    from './customQuizModel.js';
import { buildDistilledContext } from './customQuizModel.js';

const AI_PROVIDER = process.env.AI_PROVIDER || 'custom';

// ─── Provider Status ──────────────────────────────────────────────────────────

const providerStatus = {
  custom: { available: true, lastError: null },
  groq:   { available: true, lastError: null },
  ollama: { available: true, lastError: null },
  gemini: { available: true, lastError: null },
};

// ─── Custom Model (with fine-tuning) ─────────────────────────────────────────

/**
 * Run the custom model.
 * Steps:
 *  1. Build distillation context from approved questions in DB
 *  2. Generate base questions using the in-house NLP model
 *  3. Attempt to get LLM questions (Groq first, Gemini fallback) in parallel
 *  4. Fine-tune: merge custom output with LLM output via semantic matching
 */
async function generateWithCustomModel(text, numberOfQuestions, options = {}) {
  const difficulty = options.difficulty || 'medium';
  const subject    = options.subject    || null;

  // Step 1: Distillation guidance
  const distilledCtx = await buildDistilledContext({ subject, difficulty });
  if (distilledCtx.exampleCount > 0) {
    console.log(`[Orchestrator/Custom] Using ${distilledCtx.exampleCount} distilled examples for guidance`);
  }

  // Step 2: Custom NLP model generates base questions (always works, no API needed)
  const customRaw = await customModel.generateMCQsFromText(text, numberOfQuestions, { difficulty });

  // Step 3: Try to get LLM questions for fine-tuning (non-blocking – failure is OK)
  let llmQuestions = [];
  try {
    // Try Groq first (fastest)
    const groqResult = await Promise.race([
      groqService.generateMCQsFromText(text, numberOfQuestions, distilledCtx),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Groq timeout')), 12000)),
    ]);
    if (Array.isArray(groqResult) && groqResult.length > 0) {
      llmQuestions = groqResult;
      console.log(`[Orchestrator/Custom] Fine-tuning with ${llmQuestions.length} Groq questions`);
    }
  } catch (groqErr) {
    console.log(`[Orchestrator/Custom] Groq unavailable for fine-tuning (${groqErr.message}), trying Gemini...`);
    try {
      const gemResult = await Promise.race([
        geminiService.generateMCQsFromText(text, numberOfQuestions, distilledCtx),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Gemini timeout')), 15000)),
      ]);
      if (Array.isArray(gemResult) && gemResult.length > 0) {
        llmQuestions = gemResult;
        console.log(`[Orchestrator/Custom] Fine-tuning with ${llmQuestions.length} Gemini questions`);
      }
    } catch (gemErr) {
      console.log(`[Orchestrator/Custom] No LLM available for fine-tuning – using custom-only output`);
    }
  }

  // Step 4: Fine-tune custom output with LLM questions
  const fineTuned = await customModel.generateMCQsFromText(text, numberOfQuestions, {
    difficulty,
    llmQuestions,
  });

  return fineTuned;
}

// ─── Fallback Generator ───────────────────────────────────────────────────────

export async function generateMCQsWithFallback(text, numberOfQuestions = 5, options = {}) {
  const providers = getProviderOrder();
  const errors    = [];
  let lastResult  = null;
  let usedProvider = null;

  for (const provider of providers) {
    try {
      console.log(`[Orchestrator] Attempting MCQ generation with ${provider}...`);

      let result;

      if (provider === 'custom') {
        result = await generateWithCustomModel(text, numberOfQuestions, options);
      } else if (provider === 'groq') {
        const ctx = await buildDistilledContext(options).catch(() => ({}));
        result = await groqService.generateMCQsFromText(text, numberOfQuestions, ctx);
      } else if (provider === 'ollama') {
        result = await ollamaService.generateMCQsFromText(text, numberOfQuestions);
      } else if (provider === 'gemini') {
        const ctx = await buildDistilledContext(options).catch(() => ({}));
        result = await geminiService.generateMCQsFromText(text, numberOfQuestions, ctx);
      }

      if (result && result.length > 0) {
        providerStatus[provider].available = true;
        providerStatus[provider].lastError  = null;
        console.log(`[Orchestrator] ✅ ${provider} succeeded with ${result.length} questions`);

        // Ensure generatedBy is set
        result = result.map(q => ({
          ...q,
          generatedBy: q.generatedBy || provider,
        }));

        lastResult   = { result, provider };
        usedProvider = provider;
        break;
      }
    } catch (error) {
      providerStatus[provider].available = false;
      providerStatus[provider].lastError  = error.message;
      errors.push({ provider, error: error.message });
      console.log(`[Orchestrator] ❌ ${provider} failed: ${error.message}`);
    }
  }

  if (!lastResult) {
    throw new Error(
      `All AI providers failed. Errors: ${errors.map(e => `${e.provider}: ${e.error}`).join('; ')}`
    );
  }

  return {
    questions:    lastResult.result,
    provider:     usedProvider,
    fallbackUsed: usedProvider !== getPreferredProvider(),
    allErrors:    errors,
  };
}

// ─── Mixed Mode (multiple providers combined) ─────────────────────────────────

export async function generateMCQsMixed(text, numberOfQuestions = 5, options = {}) {
  const providers = getProviderOrder();
  const results   = [];
  const successfulProviders = [];

  for (const provider of providers) {
    try {
      console.log(`[Orchestrator] Fetching MCQs from ${provider}...`);

      const questionsPerProvider = Math.ceil(numberOfQuestions / 2);
      let result;

      if (provider === 'custom') {
        result = await generateWithCustomModel(text, questionsPerProvider, options);
      } else if (provider === 'groq') {
        const ctx = await buildDistilledContext(options).catch(() => ({}));
        result = await groqService.generateMCQsFromText(text, questionsPerProvider, ctx);
      } else if (provider === 'ollama') {
        result = await ollamaService.generateMCQsFromText(text, questionsPerProvider);
      } else if (provider === 'gemini') {
        const ctx = await buildDistilledContext(options).catch(() => ({}));
        result = await geminiService.generateMCQsFromText(text, questionsPerProvider, ctx);
      }

      if (result && result.length > 0) {
        result = result.map(q => ({
          ...q,
          generatedBy: q.generatedBy || provider,
        }));
        results.push(...result);
        successfulProviders.push(provider);
        console.log(`[Orchestrator] ✅ Got ${result.length} questions from ${provider}`);

        if (results.length >= numberOfQuestions) {
          results.splice(numberOfQuestions);
          break;
        }
      }
    } catch (error) {
      console.log(`[Orchestrator] ${provider} failed: ${error.message}`);
      continue;
    }
  }

  if (results.length === 0) {
    throw new Error('All providers failed to generate questions');
  }

  return {
    questions:  results,
    providers:  successfulProviders,
    mixed:      successfulProviders.length > 1,
    totalGenerated: results.length,
  };
}

// ─── Explanation Generator ────────────────────────────────────────────────────

export async function generateExplanationWithFallback(question, correctAnswer, allOptions = []) {
  const providers = getProviderOrder();

  for (const provider of providers) {
    try {
      console.log(`[Orchestrator] Generating explanation with ${provider}...`);

      let explanation;

      if (provider === 'custom') {
        explanation = await customModel.generateExplanation(question, correctAnswer, allOptions);
      } else if (provider === 'groq') {
        explanation = await groqService.generateExplanation(question, correctAnswer, allOptions);
      } else if (provider === 'ollama') {
        explanation = await ollamaService.generateExplanation(question, correctAnswer);
      } else if (provider === 'gemini') {
        explanation = await geminiService.generateExplanation(question, correctAnswer, allOptions);
      }

      if (explanation) {
        return { explanation, provider };
      }
    } catch (error) {
      console.log(`[Orchestrator] ${provider} failed: ${error.message}`);
      continue;
    }
  }

  return { explanation: 'Could not generate explanation', provider: 'none' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPreferredProvider() {
  return AI_PROVIDER === 'mixed' ? 'custom' : AI_PROVIDER;
}

function getProviderOrder() {
  const preferred = getPreferredProvider();

  // Default order: custom first (in-house model), then external LLMs
  const defaultOrder = ['custom', 'groq', 'ollama', 'gemini'];

  if (preferred === 'mixed') {
    return defaultOrder;
  }

  // Move preferred provider to front
  const order = defaultOrder.filter(p => p !== preferred);
  order.unshift(preferred);
  return order;
}

export function getProviderStatus() {
  return {
    preferred:     getPreferredProvider(),
    status:        providerStatus,
    providerOrder: getProviderOrder(),
    customModel:   customModel.getModelInfo(),
  };
}

export function resetProviderCache() {
  ollamaService.resetCache?.();
  console.log('[Orchestrator] Provider cache reset');
}
