import Groq from 'groq-sdk';

let groqClient = null;

const DEFAULT_GROQ_CANDIDATES = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'llama3-70b-8192',
  'llama3-8b-8192',
];

function getGroqCandidates() {
  const envModel = process.env.GROQ_MODEL?.trim();
  const envList = process.env.GROQ_MODELS
    ?.split(',')
    .map((m) => m.trim())
    .filter(Boolean) || [];

  const ordered = [];
  if (envModel) ordered.push(envModel);
  ordered.push(...envList, ...DEFAULT_GROQ_CANDIDATES);

  return [...new Set(ordered)];
}

async function createChatCompletionWithFallback(groq, request) {
  const candidates = getGroqCandidates();
  const modelErrors = [];

  for (const modelName of candidates) {
    try {
      const completion = await groq.chat.completions.create({
        ...request,
        model: modelName,
      });
      console.log(`✅ Using Groq model: ${modelName}`);
      return completion;
    } catch (error) {
      const errorMsg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : (error.message || String(error));
      modelErrors.push(`${modelName}: ${errorMsg}`);
      console.warn(`⚠️  Groq model ${modelName} failed, trying next...`);
    }
  }

  throw new Error(`All Groq models failed: ${modelErrors.join(' | ')}`);
}

function initializeGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    console.log('🔑 Initializing Groq with API key length:', apiKey?.length);

    if (!apiKey) {
      throw new Error('❌ CRITICAL: GROQ_API_KEY is not set in environment variables! Make sure .env.local has GROQ_API_KEY=your_key');
    }
    
    groqClient = new Groq({ apiKey });
    console.log('✅ Groq initialized successfully');
  }
  return groqClient;
}

export async function generateMCQsFromText(text, numberOfQuestions = 5) {
  try {
    const groq = initializeGroq();
    
    const prompt = `You are an expert educator. Generate ${numberOfQuestions} multiple-choice questions from the following text. 
For each question, provide:
1. The question text
2. Four options (labeled A, B, C, D)
3. The correct answer (A, B, C, or D)
4. A detailed explanation

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

    console.log('📤 Calling Groq API...');

    const completion = await createChatCompletionWithFallback(groq, {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Empty response from Groq');
    }

    console.log('📥 Received response from Groq');
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Groq response');
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error('Error generating MCQs with Groq:', error);
    throw error;
  }
}

export async function generateExplanation(question, correctAnswer, allOptions) {
  try {
    const groq = initializeGroq();
    
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

    const completion = await createChatCompletionWithFallback(groq, {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('Error generating explanation with Groq:', error);
    throw error;
  }
}
