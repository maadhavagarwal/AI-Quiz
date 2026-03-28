import * as groqService from './groqService.js';
import * as ollamaService from './ollamaService.js';
import * as geminiService from './geminiService.js';

const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';

// Track provider availability
const providerStatus = {
  groq: { available: true, lastError: null },
  ollama: { available: true, lastError: null },
  gemini: { available: true, lastError: null },
};

export async function generateMCQsWithFallback(text, numberOfQuestions = 5) {
  const providers = getProviderOrder();
  const errors = [];
  let lastResult = null;
  let usedProvider = null;

  for (const provider of providers) {
    try {
      console.log(`[Orchestrator] Attempting MCQ generation with ${provider}...`);
      
      let result;
      if (provider === 'groq') {
        result = await groqService.generateMCQsFromText(text, numberOfQuestions);
      } else if (provider === 'ollama') {
        result = await ollamaService.generateMCQsFromText(text, numberOfQuestions);
      } else if (provider === 'gemini') {
        result = await geminiService.generateMCQsFromText(text, numberOfQuestions);
      }

      if (result && result.length > 0) {
        providerStatus[provider].available = true;
        providerStatus[provider].lastError = null;
        console.log(`[Orchestrator] ✅ ${provider} succeeded with ${result.length} questions`);
        
        // Add provider metadata to each question
        result = result.map(q => ({
          ...q,
          generatedBy: provider,
        }));
        
        lastResult = { result, provider };
        usedProvider = provider;
        break;
      }
    } catch (error) {
      providerStatus[provider].available = false;
      providerStatus[provider].lastError = error.message;
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
    questions: lastResult.result,
    provider: usedProvider,
    fallbackUsed: usedProvider !== getPreferredProvider(),
    allErrors: errors,
  };
}

export async function generateMCQsMixed(text, numberOfQuestions = 5) {
  /**
   * Try to get questions from multiple providers and mix them.
   * This creates diversity in question generation.
   */
  const providers = getProviderOrder();
  const results = [];
  const successfulProviders = [];

  for (const provider of providers) {
    try {
      console.log(`[Orchestrator] Fetching MCQs from ${provider}...`);
      
      const questionsPerProvider = Math.ceil(numberOfQuestions / 2); // Split questions
      let result;

      if (provider === 'groq') {
        result = await groqService.generateMCQsFromText(text, questionsPerProvider);
      } else if (provider === 'ollama') {
        result = await ollamaService.generateMCQsFromText(text, questionsPerProvider);
      } else if (provider === 'gemini') {
        result = await geminiService.generateMCQsFromText(text, questionsPerProvider);
      }

      if (result && result.length > 0) {
        result = result.map(q => ({
          ...q,
          generatedBy: provider,
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
    questions: results,
    providers: successfulProviders,
    mixed: successfulProviders.length > 1,
    totalGenerated: results.length,
  };
}

export async function generateExplanationWithFallback(question, correctAnswer) {
  const providers = getProviderOrder();
  
  for (const provider of providers) {
    try {
      console.log(`[Orchestrator] Generating explanation with ${provider}...`);
      
      let explanation;
      if (provider === 'groq') {
        explanation = await groqService.generateExplanation(question, correctAnswer);
      } else if (provider === 'ollama') {
        explanation = await ollamaService.generateExplanation(question, correctAnswer);
      } else if (provider === 'gemini') {
        explanation = await geminiService.generateExplanation(question, correctAnswer);
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

function getPreferredProvider() {
  return AI_PROVIDER === 'mixed' ? 'groq' : AI_PROVIDER;
}

function getProviderOrder() {
  const preferred = getPreferredProvider();
  
  // Priority order: Groq → Ollama → Gemini
  const defaultOrder = ['groq', 'ollama', 'gemini'];
  
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
    preferred: getPreferredProvider(),
    status: providerStatus,
    providerOrder: getProviderOrder(),
  };
}

export function resetProviderCache() {
  ollamaService.resetCache?.();
  console.log('[Orchestrator] Provider cache reset');
}
