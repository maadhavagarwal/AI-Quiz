import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import { generateUniqueTestLink, shuffleArray } from '../utils/helpers.js';
import { extractTextFromFile, cleanText, validateTextLength } from '../utils/textExtractor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createQuiz = async (req, res) => {
  try {
    const { title, description, subject, totalmarks, passingMarks, marksPerQuestion, duration } = req.body;

    // Parse numeric values
    const parsedTotalmarks = parseInt(totalmarks);
    const parsedPassingMarks = parseInt(passingMarks);
    const parsedMarksPerQuestion = parseInt(marksPerQuestion);
    const parsedDuration = parseInt(duration);

    if (!title || !subject || !totalmarks || !passingMarks || !marksPerQuestion || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate numeric values
    if (isNaN(parsedTotalmarks) || isNaN(parsedPassingMarks) || isNaN(parsedMarksPerQuestion) || isNaN(parsedDuration)) {
      return res.status(400).json({ error: 'Invalid numeric values' });
    }

    // Process uploaded files
    const sourceFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        sourceFiles.push({
          filename: file.filename,
          fileType: file.mimetype === 'application/pdf' ? 'pdf' : file.mimetype === 'text/plain' ? 'text' : 'notes',
          originalName: file.originalname,
          fileSize: file.size,
          uploadedAt: new Date(),
        });
      });
    }

    const quiz = new Quiz({
      teacherId: req.userId,
      title,
      description,
      subject,
      totalmarks: parsedTotalmarks,
      passingMarks: parsedPassingMarks,
      marksPerQuestion: parsedMarksPerQuestion,
      duration: parsedDuration,
      totalQuestions: 0,
      questions: [],
      sourceFiles: sourceFiles.length > 0 ? sourceFiles : [],
    });

    await quiz.save();

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: quiz.toObject(),
    });
  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create quiz' });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const { page = 1, limit = 10, isPublished } = req.query;
    const skip = (page - 1) * limit;

    const query = { teacherId: req.userId };
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    const quizzes = await Quiz.find(query)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Quiz.countDocuments(query);

    res.json({
      quizzes,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('questions');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check authorization
    if (quiz.teacherId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to access this quiz' });
    }

    // Extract text from uploaded source files
    let extractedText = '';
    let extractionStatus = [];
    
    if (quiz.sourceFiles && quiz.sourceFiles.length > 0) {
      try {
        for (const file of quiz.sourceFiles) {
          try {
            const filePath = path.join(__dirname, '../uploads', file.filename);
            const fileText = await extractTextFromFile(filePath);
            if (fileText && fileText.trim()) {
              extractedText += fileText + '\n\n---\n\n';
              extractionStatus.push({ filename: file.originalName, status: 'extracted', size: fileText.length });
            } else {
              extractionStatus.push({ filename: file.originalName, status: 'empty', size: 0 });
            }
          } catch (fileError) {
            console.error(`[QuizController] Failed to extract ${file.originalName || file.filename}:`, fileError.message);
            extractionStatus.push({ filename: file.originalName || file.filename, status: 'failed', error: fileError.message });
          }
        }
        
        if (extractedText) {
          extractedText = cleanText(extractedText);
          console.log(`[QuizController] Extracted ${extractedText.length} chars from ${extractionStatus.filter(s => s.status === 'extracted').length} files`);
        } else {
          console.warn('[QuizController] No text could be extracted from uploaded files:', extractionStatus);
        }
      } catch (extractError) {
        console.error('[QuizController] Error extracting text from files:', extractError.message);
      }
    }

    const quizData = quiz.toObject();
    quizData.extractedText = extractedText;
    
    // Debug: include extraction status if files exist but extraction failed
    if (quiz.sourceFiles && quiz.sourceFiles.length > 0 && !extractedText && process.env.NODE_ENV !== 'production') {
      quizData._debug_extractionStatus = extractionStatus;
    }

    res.json(quizData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.teacherId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this quiz' });
    }

    // Update fields
    Object.assign(quiz, req.body);
    await quiz.save();

    res.json({
      message: 'Quiz updated successfully',
      quiz: quiz.toObject(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.teacherId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this quiz' });
    }

    // Delete associated questions
    await Question.deleteMany({ quizId: req.params.id });

    // Delete quiz
    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.teacherId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to publish this quiz' });
    }

    if (quiz.questions.length === 0) {
      return res.status(400).json({ error: 'Cannot publish quiz without questions' });
    }

    quiz.isPublished = true;
    await quiz.save();

    res.json({
      message: 'Quiz published successfully',
      quiz: quiz.toObject(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
