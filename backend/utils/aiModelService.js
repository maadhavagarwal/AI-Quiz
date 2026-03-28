/**
 * AI Model Service - Core AI orchestration for MCQ generation
 * Handles multiple AI providers and coordinates AI responsibilities
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import axios from 'axios';

// AI Provider Configuration
const AI_PROVIDERS = {
  GEMINI: 'gemini',
  GROQ: 'groq',
  OPENAI: 'openai'
};

class AIModelService {
  constructor() {
    this.geminiClient = null;
    this.groqClient = null;
    this.currentProvider = process.env.AI_PROVIDER || AI_PROVIDERS.GEMINI;
    this.initialized = false;
  }

  /**
   * Initialize all AI clients
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      // Initialize Gemini
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        this.geminiClient = new GoogleGenerativeAI(geminiKey);
        console.log('✅ Gemini AI initialized');
      }

      // Initialize Groq
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        this.groqClient = new Groq({ apiKey: groqKey });
        console.log('✅ Groq AI initialized');
      }

      this.initialized = true;
      console.log(`🤖 AI Model Service ready (Provider: ${this.currentProvider})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AI Model Service:', error.message);
      return false;
    }
  }

  /**
   * Generate MCQ questions from text
   * @param {string} text - Input text to generate questions from
   * @param {number} numberOfQuestions - Number of questions to generate
   * @param {string} provider - Override default AI provider
   * @returns {Promise<Array>} Array of MCQ objects
   */
  async generateMCQs(text, numberOfQuestions = 5, provider = null) {
    try {
      const selectedProvider = provider || this.currentProvider;
      
      console.log(`📝 Generating ${numberOfQuestions} MCQs using ${selectedProvider}...`);

      let result;
      switch (selectedProvider) {
        case AI_PROVIDERS.GEMINI:
          result = await this.generateWithGemini(text, numberOfQuestions);
          break;
        case AI_PROVIDERS.GROQ:
          result = await this.generateWithGroq(text, numberOfQuestions);
          break;
        default:
          result = await this.generateWithGemini(text, numberOfQuestions);
      }

      console.log(`✅ Generated ${result.length} MCQs successfully`);
      return result;
    } catch (error) {
      console.error('❌ MCQ Generation failed:', error.message);
      throw new Error(`Failed to generate MCQs: ${error.message}`);
    }
  }

  /**
   * Generate MCQs using Google Gemini
   */
  async generateWithGemini(text, numberOfQuestions) {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const geminiModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-pro'];

    const prompt = `You are an expert educator specializing in creating high-quality multiple-choice questions. 
Generate ${numberOfQuestions} MCQ questions from the provided text.

For each question, ensure:
1. Clear and concise question text
2. Exactly 4 distinct options (A, B, C, D)
3. One correct answer
4. Detailed explanation of why the answer is correct
5. Educational value and relevance to the text

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation here"
  }
]

Text to generate questions from:
${text}`;

    let responseText = null;
    let lastError = null;

    for (const modelName of geminiModels) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        console.log(`✅ Using Gemini model: ${modelName}`);
        break;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Gemini model ${modelName} not available, trying next...`);
      }
    }

    if (!responseText) {
      throw new Error(`All Gemini models failed: ${lastError?.message}`);
    }

    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      return Array.isArray(questions) ? questions : [questions];
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      throw new Error('Invalid MCQ format from Gemini');
    }
  }

  /**
   * Generate MCQs using Groq
   */
  async generateWithGroq(text, numberOfQuestions) {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }

    const prompt = `You are an expert educator specializing in creating high-quality multiple-choice questions. 
Generate ${numberOfQuestions} MCQ questions from the provided text.

For each question, ensure:
1. Clear and concise question text
2. Exactly 4 distinct options (A, B, C, D)
3. One correct answer
4. Detailed explanation of why the answer is correct
5. Educational value and relevance to the text

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation here"
  }
]

Text to generate questions from:
${text}`;

    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama3-70b-8192'];
    let response;
    let lastError = null;
    
    for (const modelName of models) {
      try {
        response = await this.groqClient.chat.completions.create({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        });
        console.log(`✅ Using Groq model: ${modelName}`);
        break;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Groq model ${modelName} not available, trying next...`);
        continue;
      }
    }
    
    if (!response) {
      throw new Error(`All Groq models failed: ${lastError?.message}`);
    }

    try {
      const responseText = response.choices[0].message.content;
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      return Array.isArray(questions) ? questions : [questions];
    } catch (parseError) {
      console.error('Failed to parse Groq response');
      throw new Error('Invalid MCQ format from Groq');
    }
  }

  /**
   * Analyze quiz answers and provide feedback
   */
  async analyzeAnswers(quiz, userAnswers, provider = null) {
    try {
      const selectedProvider = provider || this.currentProvider;
      
      console.log(`📊 Analyzing ${userAnswers.length} answers using ${selectedProvider}...`);

      const analysisPrompt = this.buildAnalysisPrompt(quiz, userAnswers);
      
      let analysis;
      switch (selectedProvider) {
        case AI_PROVIDERS.GEMINI:
          analysis = await this.analyzeWithGemini(analysisPrompt);
          break;
        case AI_PROVIDERS.GROQ:
          analysis = await this.analyzeWithGroq(analysisPrompt);
          break;
        default:
          analysis = await this.analyzeWithGemini(analysisPrompt);
      }

      return analysis;
    } catch (error) {
      console.error('❌ Answer Analysis failed:', error.message);
      throw new Error(`Failed to analyze answers: ${error.message}`);
    }
  }

  /**
   * Analyze with Gemini
   */
  async analyzeWithGemini(prompt) {
    const geminiModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-pro'];
    let responseText = null;
    let lastError = null;

    for (const modelName of geminiModels) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        console.log(`✅ Using Gemini model for analysis: ${modelName}`);
        break;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Gemini model ${modelName} not available for analysis, trying next...`);
      }
    }

    if (!responseText) {
      throw new Error(`All Gemini models failed: ${lastError?.message}`);
    }

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch {
      return { analysis: responseText };
    }
  }

  /**
   * Analyze with Groq
   */
  async analyzeWithGroq(prompt) {
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama3-70b-8192'];
    let response;
    let lastError = null;
    
    for (const modelName of models) {
      try {
        response = await this.groqClient.chat.completions.create({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 1500
        });
        console.log(`✅ Using Groq model for analysis: ${modelName}`);
        break;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Groq model ${modelName} not available for analysis, trying next...`);
        continue;
      }
    }
    
    if (!response) {
      throw new Error(`All Groq models failed: ${lastError?.message}`);
    }

    try {
      const responseText = response.choices[0].message.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch {
      return { analysis: response.choices[0].message.content };
    }
  }

  /**
   * Build analysis prompt
   */
  buildAnalysisPrompt(quiz, userAnswers) {
    const questionsStr = quiz.questions
      .map((q, i) => `Q${i + 1}: ${q.question}`)
      .join('\n');

    return `Analyze the following quiz performance and provide feedback:

Quiz: ${quiz.title}
Total Questions: ${quiz.questions.length}

Questions:
${questionsStr}

User Performance:
Correct Answers: ${userAnswers.filter(a => a.isCorrect).length}/${userAnswers.length}
Score: ${((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100).toFixed(1)}%

Provide detailed feedback in JSON format:
{
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "overallAssessment": "Brief assessment text"
}`;
  }

  /**
   * Validate MCQ structure
   */
  validateMCQ(mcq) {
    const required = ['question', 'options', 'correctAnswer', 'explanation'];
    for (const field of required) {
      if (!mcq[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(mcq.options) || mcq.options.length !== 4) {
      throw new Error('Options must be an array of exactly 4 items');
    }

    if (![0, 1, 2, 3].includes(mcq.correctAnswer)) {
      throw new Error('correctAnswer must be 0, 1, 2, or 3');
    }

    return true;
  }

  /**
   * Get available AI providers
   */
  getAvailableProviders() {
    const available = [];
    if (this.geminiClient) available.push(AI_PROVIDERS.GEMINI);
    if (this.groqClient) available.push(AI_PROVIDERS.GROQ);
    return available;
  }

  /**
   * Set current AI provider
   */
  setProvider(provider) {
    if (Object.values(AI_PROVIDERS).includes(provider)) {
      this.currentProvider = provider;
      console.log(`🔄 AI Provider switched to: ${provider}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export default new AIModelService();
