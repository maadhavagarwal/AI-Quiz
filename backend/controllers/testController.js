import Test from '../models/Test.js';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import { generateUniqueTestLink, calculateScore, shuffleArray } from '../utils/helpers.js';
import { recordQuestionOutcome } from '../utils/distillationService.js';

export const generateTestLink = async (req, res) => {
  try {
    const { quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({ error: 'quizId is required' });
    }

    // Verify quiz exists and is published
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (!quiz.isPublished) {
      return res.status(400).json({ error: 'Quiz is not published yet' });
    }

    // Generate unique test link
    const uniqueCode = generateUniqueTestLink().toLowerCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create test instance
    const test = new Test({
      quizId,
      uniqueLink: uniqueCode,
      status: 'not-started',
      expiresAt,
    });

    await test.save();

    res.json({
      _id: test._id,
      testLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test/${uniqueCode}`,
      uniqueCode,
      uniqueLink: uniqueCode,
      expiresAt, // 24 hours from now
      message: 'Share this link with students - Valid for 24 hours',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTest = async (req, res) => {
  try {
    const normalizedLink = decodeURIComponent(String(req.params.uniqueLink || '')).trim().toLowerCase();

    if (!normalizedLink) {
      return res.status(400).json({ error: 'Invalid test link' });
    }

    console.log(`🔍 Looking for test with link: ${normalizedLink}`);

    const test = await Test.findOne({ uniqueLink: normalizedLink }).populate({
      path: 'quizId',
      select: 'title duration totalQuestions marksPerQuestion totalmarks questions',
    });

    if (!test) {
      console.warn(`⚠️ Test not found with link: ${normalizedLink}`);
      return res.status(404).json({ error: 'Test not found or link expired' });
    }

    // Check if test link has expired
    if (test.expiresAt && new Date() > test.expiresAt) {
      console.warn(`⚠️ Test link expired: ${normalizedLink}`);
      return res.status(410).json({ 
        error: 'This test link has expired. Please request a new link from your instructor.',
        expiredAt: test.expiresAt 
      });
    }

    console.log(`✅ Test found: ${test._id}`);

    const quizQuestionIds = (test.quizId.questions || []).map((id) => id.toString());

    // Build and persist randomized presentation once per test link.
    const needsPresentationBuild =
      !Array.isArray(test.presentedQuestions) ||
      test.presentedQuestions.length !== quizQuestionIds.length;

    if (needsPresentationBuild) {
      const shuffledQuestionIds = shuffleArray(quizQuestionIds);
      test.presentedQuestions = shuffledQuestionIds.map((questionId) => ({
        questionId,
        optionOrder: shuffleArray([0, 1, 2, 3]),
      }));
      await test.save();
    }

    // Get questions and return them in persisted randomized order with shuffled options.
    const questionIds = test.presentedQuestions.map((entry) => entry.questionId);
    const rawQuestions = await Question.find({ _id: { $in: questionIds } }).select(
      'question options difficulty marks'
    );
    const questionMap = new Map(rawQuestions.map((question) => [question._id.toString(), question]));

    const questions = test.presentedQuestions
      .map((entry) => {
        const question = questionMap.get(entry.questionId.toString());
        if (!question) {
          return null;
        }

        const optionOrder = Array.isArray(entry.optionOrder) && entry.optionOrder.length === 4
          ? entry.optionOrder
          : [0, 1, 2, 3];

        return {
          _id: question._id,
          question: question.question,
          options: optionOrder.map((idx) => question.options[idx]),
          difficulty: question.difficulty,
          marks: question.marks,
        };
      })
      .filter(Boolean);

    res.json({
      testId: test._id,
      quizTitle: test.quizId.title,
      duration: test.quizId.duration,
      totalQuestions: test.quizId.totalQuestions,
      questions,
      status: test.status,
      timeRemaining: test.status === 'not-started' ? test.quizId.duration * 60 : null,
    });
  } catch (error) {
    console.error('❌ Error in getTest:', error);
    res.status(500).json({ error: error.message });
  }
};

export const startTest = async (req, res) => {
  try {
    const normalizedLink = decodeURIComponent(String(req.params.uniqueLink || '')).trim().toLowerCase();
    const { studentName, studentEmail } = req.body;

    const test = await Test.findOne({ uniqueLink: normalizedLink });
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    test.status = 'in-progress';
    test.startedAt = new Date();
    test.studentName = studentName;
    test.studentEmail = studentEmail;
    await test.save();

    res.json({
      testId: test._id,
      status: 'in-progress',
      startedAt: test.startedAt,
      timeRemaining: 1800,
      message: 'Test started successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitResponse = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questionId, selectedOptionIndex, timeSpent } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const presentedQuestion = (test.presentedQuestions || []).find(
      (entry) => entry.questionId.toString() === String(questionId)
    );

    const optionOrder =
      presentedQuestion && Array.isArray(presentedQuestion.optionOrder) && presentedQuestion.optionOrder.length === 4
        ? presentedQuestion.optionOrder
        : [0, 1, 2, 3];

    const selectedOriginalIndex = optionOrder[selectedOptionIndex];
    const isCorrect = selectedOriginalIndex === question.correctAnswerIndex;

    test.responses.push({
      questionId,
      selectedOptionIndex: selectedOriginalIndex,
      isCorrect,
      timeSpent,
    });

    await test.save();
    await recordQuestionOutcome(questionId, isCorrect, timeSpent);

    res.json({
      message: 'Response recorded',
      isCorrect,
      remainingQuestions: (test.quizId?.questions.length || 0) - test.responses.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { tabSwitchCount = 0 } = req.body;

    const test = await Test.findById(testId).populate('quizId');
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check if auto-submit due to tab switches
    if (tabSwitchCount >= 3) {
      test.isAutoSubmitted = true;
    }

    // Calculate score
    let score = 0;
    test.responses.forEach(response => {
      if (response.isCorrect) {
        score += 1;
      }
    });

    const totalMarks = test.quizId.totalmarks;
    const percentage = Math.round((score / test.responses.length) * 100) || 0;

    test.status = 'submitted';
    test.completedAt = new Date();
    test.score = score;
    test.percentage = percentage;
    test.totalTime = Math.floor((test.completedAt - test.startedAt) / 1000);
    test.tabSwitchCount = tabSwitchCount;

    await test.save();

    res.json({
      testId: test._id,
      status: 'submitted',
      score,
      totalMarks,
      percentage,
      passingMarks: test.quizId.passingMarks,
      isPassed: percentage >= (test.quizId.passingMarks / test.quizId.totalmarks) * 100,
      completedAt: test.completedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestResults = async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await Test.findById(testId).populate({
      path: 'responses.questionId',
      select: 'question options correctAnswerIndex explanation marks',
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const results = test.responses.map((response, idx) => ({
      questionNumber: idx + 1,
      question: response.questionId.question,
      selectedOption: response.questionId.options[response.selectedOptionIndex],
      correctOption: response.questionId.options[response.questionId.correctAnswerIndex],
      isCorrect: response.isCorrect,
      explanation: response.questionId.explanation,
      marks: response.isCorrect ? response.questionId.marks : 0,
    }));

    res.json({
      testId: test._id,
      studentName: test.studentName,
      studentEmail: test.studentEmail,
      score: test.score,
      totalMarks: test.responses.length,
      percentage: test.percentage,
      completedAt: test.completedAt,
      responses: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentTestResults = async (req, res) => {
  try {
    const { testId } = req.params;
    const teacherId = req.userId; // From auth middleware

    const test = await Test.findById(testId).populate([
      {
        path: 'quizId',
        select: 'teacherId title',
        match: { teacherId }
      },
      {
        path: 'responses.questionId',
        select: 'question options correctAnswerIndex explanation marks',
      }
    ]);

    if (!test || !test.quizId) {
      return res.status(403).json({ error: 'Not authorized or test not found' });
    }

    const results = test.responses.map((response, idx) => ({
      questionNumber: idx + 1,
      question: response.questionId.question,
      selectedOption: response.questionId.options[response.selectedOptionIndex],
      correctOption: response.questionId.options[response.questionId.correctAnswerIndex],
      isCorrect: response.isCorrect,
      explanation: response.questionId.explanation,
      marks: response.isCorrect ? response.questionId.marks : 0,
    }));

    res.json({
      testId: test._id,
      quizTitle: test.quizId.title,
      studentName: test.studentName,
      studentEmail: test.studentEmail,
      score: test.score,
      totalMarks: test.responses.length,
      percentage: test.percentage,
      status: test.status,
      startedAt: test.startedAt,
      completedAt: test.completedAt,
      totalTime: test.totalTime,
      tabSwitchCount: test.tabSwitchCount,
      isAutoSubmitted: test.isAutoSubmitted,
      responses: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
