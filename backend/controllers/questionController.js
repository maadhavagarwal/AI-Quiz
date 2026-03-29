import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';
import { generateMCQsWithFallback, generateMCQsMixed } from '../utils/aiOrchestrator.js';
import { cleanText, validateTextLength, extractTextFromFile } from '../utils/textExtractor.js';
import { getDistilledGuidance, markQuestionAsDistilled } from '../utils/distillationService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateQuestions = async (req, res) => {
  try {
    const {
      quizId,
      text,
      numberOfQuestions = 10,
      difficulty = 'medium',
      mixedOutput = false,
      aiProvider = 'custom',
    } = req.body;

    if (!quizId) {
      return res.status(400).json({ error: 'quizId is required' });
    }

    // Validate quiz exists and user owns it
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.teacherId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to add questions to this quiz' });
    }

    let sourceText = typeof text === 'string' ? text : '';

    // If text is empty, fall back to text extracted from already uploaded quiz files.
    if (!sourceText.trim() && Array.isArray(quiz.sourceFiles) && quiz.sourceFiles.length > 0) {
      let extractedText = '';

      for (const file of quiz.sourceFiles) {
        try {
          const filePath = path.join(__dirname, '../uploads', file.filename);
          const fileText = await extractTextFromFile(filePath);
          if (fileText?.trim()) {
            extractedText += `${fileText}\n\n---\n\n`;
          }
        } catch (extractError) {
          console.error(`[QuestionController] Failed to extract ${file.originalName || file.filename}:`, extractError.message);
        }
      }

      sourceText = extractedText;
    }

    if (!sourceText.trim()) {
      return res.status(400).json({
        error: 'Please enter study material or upload source files for this quiz before generating questions',
      });
    }

    // Validate text length
    validateTextLength(sourceText);
    const cleanedText = cleanText(sourceText);

    console.log(`[QuestionController] Generating ${numberOfQuestions} questions...`);
    
    const distillationEnabled = process.env.ENABLE_DISTILLATION !== 'false';
    const distilled = distillationEnabled
      ? await getDistilledGuidance({ subject: quiz.subject, difficulty, maxExamples: 3 })
      : { guidanceText: '' };

    let generationResult;
    try {
      const orchestratorOptions = {
        difficulty,
        subject: quiz.subject,
        preferredProvider: aiProvider,
        distilledGuidance: distilled.guidanceText,
      };

      if (mixedOutput) {
        generationResult = await generateMCQsMixed(cleanedText, numberOfQuestions, orchestratorOptions);
      } else {
        generationResult = await generateMCQsWithFallback(cleanedText, numberOfQuestions, orchestratorOptions);
      }
    } catch (error) {
      console.error('[QuestionController] MCQ Generation failed:', error.message);

      const providerHints = [
        'Custom: In-house model (default, no config needed).',
        'Ollama: start local service (ollama serve) and pull model (ollama pull llama2 or ollama pull mistral).',
        'Groq: verify GROQ_API_KEY and optionally set GROQ_MODEL / GROQ_MODELS in backend/.env.local.',
        'Gemini: verify GEMINI_API_KEY and optionally set GEMINI_MODEL / GEMINI_MODELS in backend/.env.local.',
      ];

      const friendlyError =
        'MCQ generation failed across available providers. ' +
        'Check provider setup and try again.\n' +
        providerHints.map((hint, idx) => `${idx + 1}. ${hint}`).join('\n');
      
      return res.status(503).json({ 
        error: friendlyError,
        details: error.message,
      });
    }

    const generatedQuestionsData = generationResult.questions;

    if (!generatedQuestionsData || generatedQuestionsData.length === 0) {
      return res.status(500).json({ error: 'Failed to generate questions' });
    }

    // Save to database
    const savedQuestions = [];
    for (const q of generatedQuestionsData) {
      try {
        // Normalize and validate question data
        const normalizedOptions = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
        
        // Ensure we have exactly 4 options
        while (normalizedOptions.length < 4) {
          normalizedOptions.push(`Option ${String.fromCharCode(65 + normalizedOptions.length)}`);
        }

        // Convert correctAnswer to a number and ensure it's in range [0-3]
        let correctAnswerIndex = Number(q.correctAnswer);
        if (isNaN(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
          // If invalid, assume first option is correct
          correctAnswerIndex = 0;
        }

        const question = new Question({
          quizId,
          question: String(q.question || '').trim() || 'Question',
          options: normalizedOptions.map(opt => String(opt || '').trim()),
          correctAnswerIndex,
          explanation: String(q.explanation || '').trim() || 'No explanation provided',
          marks: quiz.marksPerQuestion,
          difficulty,
          generatedBy: q.generatedBy || 'unknown',
          isApproved: false,
          distilledFromLLM: ['custom', 'gemini', 'groq', 'ollama', 'mixed', 'hybrid'].includes(q.generatedBy || 'unknown'),
        });

        await question.save();
        savedQuestions.push(question);
      } catch (saveError) {
        console.error(`[QuestionController] Failed to save question ${q.question?.substring(0, 50)}:`, saveError.message);
        // Continue with next question instead of failing entirely
      }
    }

    // Update quiz with question count
    quiz.totalQuestions = (quiz.totalQuestions || 0) + savedQuestions.length;
    quiz.questions.push(...savedQuestions.map(q => q._id));
    await quiz.save();

    res.status(201).json({
      message: 'Questions generated successfully',
      questions: savedQuestions,
      totalGenerated: savedQuestions.length,
      generatedBy: generatedQuestionsData[0]?.generatedBy || 'unknown',
      provider: generationResult.provider || 'multiple',
      fallbackUsed: generationResult.fallbackUsed || false,
      primaryProvider: generatedQuestionsData[0]?.generatedBy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[QuestionController] Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify quiz ownership
    const quiz = await Quiz.findById(question.quizId);
    if (quiz.teacherId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this question' });
    }

    Object.assign(question, req.body);
    await question.save();

    res.json({
      message: 'Question updated successfully',
      question: question.toObject(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify quiz ownership
    const quiz = await Quiz.findById(question.quizId);
    if (quiz.teacherId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to approve this question' });
    }

    question.isApproved = true;
    await question.save();
    await markQuestionAsDistilled(question._id);

    res.json({
      message: 'Question approved',
      question: question.toObject(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify quiz ownership
    const quiz = await Quiz.findById(question.quizId);
    if (quiz.teacherId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this question' });
    }

    await Question.findByIdAndDelete(req.params.id);

    // Update quiz question count
    quiz.totalQuestions = Math.max(0, (quiz.totalQuestions || 1) - 1);
    quiz.questions = quiz.questions.filter(id => id.toString() !== req.params.id);
    await quiz.save();

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
