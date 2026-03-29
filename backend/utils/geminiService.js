import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Lazy load - only initialize when first called
let genAI = null;
let selectedGeminiModel = null;

const DEFAULT_GEMINI_CANDIDATES = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
];

function getGeminiCandidates() {
  const envModel = process.env.GEMINI_MODEL?.trim();
  const envList = process.env.GEMINI_MODELS
    ?.split(',')
    .map((m) => m.trim())
    .filter(Boolean) || [];

  const ordered = [];
  if (envModel) ordered.push(envModel);
  ordered.push(...envList, ...DEFAULT_GEMINI_CANDIDATES);

  return [...new Set(ordered)];
}

async function resolveGeminiModel(ai) {
  if (selectedGeminiModel) {
    return selectedGeminiModel;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const candidates = getGeminiCandidates();

  // First try API model discovery so we only pick models that support generateContent.
  try {
    const response = await axios.get('https://generativelanguage.googleapis.com/v1/models', {
      params: { key: apiKey },
      timeout: 5000,
    });

    const discovered = (response.data?.models || [])
      .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => (m.name || '').replace(/^models\//, ''))
      .filter(Boolean);

    for (const preferred of candidates) {
      const match = discovered.find((name) => name === preferred || name.includes(preferred));
      if (match) {
        selectedGeminiModel = match;
        console.log(`✅ Using Gemini model: ${selectedGeminiModel}`);
        return selectedGeminiModel;
      }
    }

    if (discovered.length > 0) {
      selectedGeminiModel = discovered[0];
      console.log(`✅ Using discovered Gemini model: ${selectedGeminiModel}`);
      return selectedGeminiModel;
    }
  } catch (error) {
    console.warn(`⚠️  Gemini model discovery failed: ${error.message}`);
  }

  // Fallback: probe known candidates directly until one works.
  const modelErrors = [];
  for (const candidate of candidates) {
    try {
      const model = ai.getGenerativeModel({ model: candidate });
      await model.generateContent('Respond with only the word OK.');
      selectedGeminiModel = candidate;
      console.log(`✅ Using Gemini model (probed): ${selectedGeminiModel}`);
      return selectedGeminiModel;
    } catch (error) {
      modelErrors.push(`${candidate}: ${error.message}`);
    }
  }

  throw new Error(`No working Gemini model found. Tried: ${candidates.join(', ')}. Errors: ${modelErrors.join(' | ')}`);
}

async function getGeminiModel(ai) {
  const modelName = await resolveGeminiModel(ai);
  return ai.getGenerativeModel({ model: modelName });
}

function initializeGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔑 Initializing Gemini with API key length:', apiKey?.length);
    console.log('🔑 API Key starts with:', apiKey?.substring(0, 10));

    if (!apiKey) {
      throw new Error('❌ CRITICAL: GEMINI_API_KEY is not set in environment variables! Make sure .env.local has GEMINI_API_KEY=your_key');
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini initialized successfully');
  }
  return genAI;
}

export async function generateMCQsFromText(text, numberOfQuestions = 5, context = {}) {
  try {
    const ai = initializeGenAI();
    const model = await getGeminiModel(ai);
    
    const distilledGuidance = context?.distilledGuidance
      ? `\nUse these distilled best-practice examples from previously approved high-quality questions:\n${context.distilledGuidance}\n`
      : '';

    const prompt = `You are an expert educator. Generate ${numberOfQuestions} multiple-choice questions from the following text. 
For each question, provide:
1. The question text
2. Four options (labeled A, B, C, D)
3. The correct answer (A, B, C, or D)
4. A detailed explanation

${distilledGuidance}

Format as JSON array with this structure:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation"
  }
]

Text to generate questions from:
${text}

Generate only valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error('Error generating MCQs:', error);
    throw error;
  }
}

export async function generateExplanation(question, correctAnswer, allOptions) {
  try {
    const ai = initializeGenAI();
    const model = await getGeminiModel(ai);
    
    const prompt = `Provide a detailed explanation for the following multiple-choice question:

Question: ${question}

Options:
A) ${allOptions[0]}
B) ${allOptions[1]}
C) ${allOptions[2]}
D) ${allOptions[3]}

Correct Answer: ${correctAnswer}

Explanation should:
1. Explain why the correct answer is right
2. Explain why other options are wrong
3. Provide relevant context or concepts

Keep it concise but comprehensive (2-3 paragraphs).`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating explanation:', error);
    throw error;
  }
}
