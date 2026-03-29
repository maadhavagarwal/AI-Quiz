/**
 * AI Model Controller
 * ────────────────────
 * Handles MCQ generation via all AI providers including the custom in-house model.
 * Routes that deal with generation now route through the aiOrchestrator for
 * automatic fallback and fine-tuning support.
 */

import AIModelService from '../utils/aiModelService.js';
import * as textExtractor from '../utils/textExtractor.js';
import * as aiOrchestrator from '../utils/aiOrchestrator.js';
import * as customModel from '../utils/customQuizModel.js';

// ─── Initialize AI Service ────────────────────────────────────────────────────

/**
 * POST /api/ai/init
 */
export async function initializeAI(req, res) {
  try {
    const success = await AIModelService.initialize();

    if (success) {
      const providers = AIModelService.getAvailableProviders();
      res.json({
        success: true,
        message: 'AI Model Service initialized',
        currentProvider: AIModelService.currentProvider,
        availableProviders: providers,
        customModel: customModel.getModelInfo(),
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize AI Model Service',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Initialization error', error: error.message });
  }
}

// ─── Generate MCQs from text ──────────────────────────────────────────────────

/**
 * POST /api/ai/generate-mcqs
 * Body: { text, numberOfQuestions, provider, difficulty, subject }
 *
 * If provider is 'custom' (or omitted, since custom is now the default),
 * uses the orchestrator which runs the custom model + optional LLM fine-tuning.
 */
export async function generateMCQs(req, res) {
  try {
    const {
      text,
      numberOfQuestions = 5,
      provider,
      difficulty = 'medium',
      subject,
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Text content is required' });
    }

    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      return res.status(400).json({
        success: false,
        message: 'Number of questions must be between 1 and 20',
      });
    }

    const orchestratorResult = await aiOrchestrator.generateMCQsWithFallback(
      text,
      Number(numberOfQuestions),
      { difficulty, subject, preferredProvider: provider }
    );

    res.json({
      success: true,
      message: `Generated ${orchestratorResult.questions.length} MCQ questions`,
      data: {
        questions:    orchestratorResult.questions,
        count:        orchestratorResult.questions.length,
        provider:     orchestratorResult.provider,
        fallbackUsed: orchestratorResult.fallbackUsed,
        fineTuned:    orchestratorResult.questions.some(q => q.fineTuned),
      },
    });
  } catch (error) {
    console.error('MCQ Generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate MCQs', error: error.message });
  }
}

// ─── Generate MCQs from file ──────────────────────────────────────────────────

/**
 * POST /api/ai/generate-mcqs-from-file
 * Body: { fileContent, fileName, numberOfQuestions, provider, difficulty }
 */
export async function generateMCQsFromFile(req, res) {
  try {
    const {
      fileContent,
      fileName,
      numberOfQuestions = 5,
      provider,
      difficulty = 'medium',
    } = req.body;

    if (!fileContent) {
      return res.status(400).json({ success: false, message: 'File content is required' });
    }

    let extractedText = fileContent;

    const orchestratorResult = await aiOrchestrator.generateMCQsWithFallback(
      extractedText,
      Number(numberOfQuestions),
      { difficulty, preferredProvider: provider }
    );

    res.json({
      success: true,
      message: `Generated ${orchestratorResult.questions.length} MCQ questions from file`,
      data: {
        questions:   orchestratorResult.questions,
        count:       orchestratorResult.questions.length,
        sourceFile:  fileName,
        provider:    orchestratorResult.provider,
        fineTuned:   orchestratorResult.questions.some(q => q.fineTuned),
      },
    });
  } catch (error) {
    console.error('File-based MCQ Generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate MCQs from file', error: error.message });
  }
}

// ─── Custom Model – Direct Endpoint ──────────────────────────────────────────

/**
 * POST /api/ai/custom/generate
 * Body: { text, numberOfQuestions, difficulty, subject, fineTune }
 *
 * Directly calls the custom quiz model.
 * fineTune=false → pure rule-based output (fastest, no API calls)
 * fineTune=true  → also fetches from Groq/Gemini and merges (default)
 */
export async function generateWithCustomModel(req, res) {
  try {
    const {
      text,
      numberOfQuestions = 5,
      difficulty = 'medium',
      subject,
      fineTune = true,
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Text content is required' });
    }

    if (fineTune) {
      // Full pipeline: custom + LLM fine-tuning
      const result = await aiOrchestrator.generateMCQsWithFallback(
        text,
        Number(numberOfQuestions),
        { difficulty, subject, preferredProvider: 'custom' }
      );

      return res.json({
        success: true,
        message: `Custom model generated ${result.questions.length} questions (fine-tuned with LLM)`,
        model:  customModel.getModelInfo(),
        data: {
          questions:    result.questions,
          count:        result.questions.length,
          provider:     result.provider,
          fineTuned:    result.questions.some(q => q.fineTuned),
          fineTuneRate: `${result.questions.filter(q => q.fineTuned).length}/${result.questions.length}`,
        },
      });
    } else {
      // Pure custom model only — no external API calls
      const questions = await customModel.generateMCQsFromText(
        text,
        Number(numberOfQuestions),
        { difficulty }
      );

      return res.json({
        success: true,
        message: `Custom model generated ${questions.length} questions (standalone, no fine-tuning)`,
        model:  customModel.getModelInfo(),
        data: {
          questions,
          count:    questions.length,
          provider: 'custom',
          fineTuned: false,
        },
      });
    }
  } catch (error) {
    console.error('Custom model generation error:', error);
    res.status(500).json({ success: false, message: 'Custom model failed', error: error.message });
  }
}

/**
 * GET /api/ai/custom/info
 * Returns metadata about the custom quiz model.
 */
export async function getCustomModelInfo(req, res) {
  try {
    const info = customModel.getModelInfo();
    const orchestratorStatus = aiOrchestrator.getProviderStatus();

    res.json({
      success: true,
      data: {
        model:       info,
        status:      orchestratorStatus.status.custom,
        providerOrder: orchestratorStatus.providerOrder,
        isDefault:   orchestratorStatus.preferred === 'custom',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get custom model info', error: error.message });
  }
}

// ─── Analyze Answers ──────────────────────────────────────────────────────────

/**
 * POST /api/ai/analyze-answers
 * Body: { quiz, userAnswers, provider }
 */
export async function analyzeAnswers(req, res) {
  try {
    const { quiz, userAnswers, provider } = req.body;

    if (!quiz || !userAnswers) {
      return res.status(400).json({ success: false, message: 'Quiz and userAnswers are required' });
    }

    const analysis = await AIModelService.analyzeAnswers(quiz, userAnswers, provider);

    res.json({
      success: true,
      message: 'Quiz answers analyzed',
      data: { analysis, provider: provider || AIModelService.currentProvider },
    });
  } catch (error) {
    console.error('Answer Analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze answers', error: error.message });
  }
}

// ─── Providers ────────────────────────────────────────────────────────────────

/**
 * GET /api/ai/providers
 */
export async function getProviders(req, res) {
  try {
    const legacyProviders = AIModelService.getAvailableProviders();
    const orchestratorStatus = aiOrchestrator.getProviderStatus();

    res.json({
      success: true,
      data: {
        currentProvider:    orchestratorStatus.preferred,
        availableProviders: ['custom', ...legacyProviders],
        providerOrder:      orchestratorStatus.providerOrder,
        providerStatus:     orchestratorStatus.status,
        customModel:        orchestratorStatus.customModel,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get providers', error: error.message });
  }
}

/**
 * POST /api/ai/switch-provider
 * Body: { provider }
 */
export async function switchProvider(req, res) {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, message: 'Provider name is required' });
    }

    const validProviders = ['custom', 'gemini', 'groq', 'openai', 'ollama', 'mixed'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: `Invalid provider: ${provider}`,
        validProviders,
      });
    }

    // For non-custom providers, delegate to legacy service
    if (provider !== 'custom') {
      AIModelService.setProvider(provider);
    }

    res.json({
      success: true,
      message: `Switched to ${provider} provider`,
      currentProvider: provider,
      note: provider === 'custom' ? 'Using in-house CustomQuizModel with LLM fine-tuning' : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to switch provider', error: error.message });
  }
}

/**
 * GET /api/ai/status
 */
export async function getStatus(req, res) {
  try {
    const orchestratorStatus = aiOrchestrator.getProviderStatus();

    res.json({
      success: true,
      data: {
        initialized:       AIModelService.initialized,
        currentProvider:   orchestratorStatus.preferred,
        availableProviders: AIModelService.getAvailableProviders(),
        providerOrder:     orchestratorStatus.providerOrder,
        providerStatus:    orchestratorStatus.status,
        customModel:       orchestratorStatus.customModel,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get AI status', error: error.message });
  }
}
