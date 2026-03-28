/**
 * AI Model Controller - Handles MCQ generation and AI-related operations
 */

import AIModelService from '../utils/aiModelService.js';
import * as textExtractor from '../utils/textExtractor.js';

/**
 * Initialize AI Model Service
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
        availableProviders: providers
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize AI Model Service'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Initialization error',
      error: error.message
    });
  }
}

/**
 * Generate MCQ questions from text
 * POST /api/ai/generate-mcqs
 * Body: { text, numberOfQuestions, provider }
 */
export async function generateMCQs(req, res) {
  try {
    const { text, numberOfQuestions = 5, provider } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text content is required'
      });
    }

    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      return res.status(400).json({
        success: false,
        message: 'Number of questions must be between 1 and 20'
      });
    }

    const mcqs = await AIModelService.generateMCQs(text, numberOfQuestions, provider);

    // Validate all MCQs
    const validatedMCQs = mcqs.map(mcq => {
      AIModelService.validateMCQ(mcq);
      return mcq;
    });

    res.json({
      success: true,
      message: `Generated ${validatedMCQs.length} MCQ questions`,
      data: {
        questions: validatedMCQs,
        count: validatedMCQs.length,
        provider: provider || AIModelService.currentProvider
      }
    });
  } catch (error) {
    console.error('MCQ Generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate MCQs',
      error: error.message
    });
  }
}

/**
 * Generate MCQs from uploaded file
 * POST /api/ai/generate-mcqs-from-file
 * Body: { fileContent, numberOfQuestions, provider }
 */
export async function generateMCQsFromFile(req, res) {
  try {
    const { fileContent, fileName, numberOfQuestions = 5, provider } = req.body;

    if (!fileContent) {
      return res.status(400).json({
        success: false,
        message: 'File content is required'
      });
    }

    // Extract text from file content based on file type
    let extractedText = fileContent;
    if (fileName) {
      if (fileName.endsWith('.pdf')) {
        // PDF extraction would be handled here
        extractedText = fileContent;
      } else if (fileName.endsWith('.docx')) {
        // DOCX extraction would be handled here
        extractedText = fileContent;
      }
    }

    const mcqs = await AIModelService.generateMCQs(extractedText, numberOfQuestions, provider);

    res.json({
      success: true,
      message: `Generated ${mcqs.length} MCQ questions from file`,
      data: {
        questions: mcqs,
        count: mcqs.length,
        sourceFile: fileName,
        provider: provider || AIModelService.currentProvider
      }
    });
  } catch (error) {
    console.error('File-based MCQ Generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate MCQs from file',
      error: error.message
    });
  }
}

/**
 * Analyze quiz answers
 * POST /api/ai/analyze-answers
 * Body: { quizId, userAnswers }
 */
export async function analyzeAnswers(req, res) {
  try {
    const { quiz, userAnswers, provider } = req.body;

    if (!quiz || !userAnswers) {
      return res.status(400).json({
        success: false,
        message: 'Quiz and userAnswers are required'
      });
    }

    const analysis = await AIModelService.analyzeAnswers(quiz, userAnswers, provider);

    res.json({
      success: true,
      message: 'Quiz answers analyzed',
      data: {
        analysis,
        provider: provider || AIModelService.currentProvider
      }
    });
  } catch (error) {
    console.error('Answer Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze answers',
      error: error.message
    });
  }
}

/**
 * Get available AI providers
 * GET /api/ai/providers
 */
export async function getProviders(req, res) {
  try {
    const providers = AIModelService.getAvailableProviders();
    
    res.json({
      success: true,
      data: {
        currentProvider: AIModelService.currentProvider,
        availableProviders: providers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get providers',
      error: error.message
    });
  }
}

/**
 * Switch AI provider
 * POST /api/ai/switch-provider
 * Body: { provider }
 */
export async function switchProvider(req, res) {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider name is required'
      });
    }

    const success = AIModelService.setProvider(provider);

    if (success) {
      res.json({
        success: true,
        message: `Switched to ${provider} provider`,
        currentProvider: AIModelService.currentProvider
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Invalid provider: ${provider}`,
        availableProviders: AIModelService.getAvailableProviders()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to switch provider',
      error: error.message
    });
  }
}

/**
 * Get AI model status
 * GET /api/ai/status
 */
export async function getStatus(req, res) {
  try {
    res.json({
      success: true,
      data: {
        initialized: AIModelService.initialized,
        currentProvider: AIModelService.currentProvider,
        availableProviders: AIModelService.getAvailableProviders()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status',
      error: error.message
    });
  }
}
