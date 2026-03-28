import Quiz from '../models/Quiz.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const teacherId = req.userId;

    // Get basic stats
    const quizzes = await Quiz.find({ teacherId });
    const totalQuizzes = quizzes.length;
    const totalQuestions = await Question.countDocuments({ quizId: { $in: quizzes.map(q => q._id) } });

    // Get test stats
    const tests = await Test.find({
      quizId: { $in: quizzes.map(q => q._id) },
    });

    const totalSubmissions = tests.filter(t => t.status === 'submitted').length;
    const totalStudents = new Set(tests.map(t => t.studentEmail)).size;

    let averageScore = 0;
    if (totalSubmissions > 0) {
      const totalScore = tests.reduce((sum, t) => sum + (t.score || 0), 0);
      averageScore = Math.round((totalScore / totalSubmissions) * 100) / 100;
    }

    // Recent quizzes
    const recentQuizzes = quizzes.slice(-5).reverse().map(quiz => ({
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      totalQuestions: quiz.totalQuestions,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt,
    }));

    res.json({
      totalQuizzes,
      totalQuestions,
      totalStudents,
      totalSubmissions,
      averageScore,
      recentQuizzes,
      stats: {
        publishedQuizzes: quizzes.filter(q => q.isPublished).length,
        draftQuizzes: quizzes.filter(q => !q.isPublished).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuizPerformance = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.userId;

    // Verify quiz ownership
    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.teacherId.toString() !== teacherId) {
      return res.status(403).json({ error: 'Not authorized to view this quiz' });
    }

    // Get all test submissions for this quiz
    const tests = await Test.find({
      quizId,
      status: 'submitted',
    }).populate('responses.questionId');

    if (tests.length === 0) {
      return res.json({
        quizId,
        title: quiz.title,
        totalSubmissions: 0,
        averageScore: 0,
        message: 'No submissions yet',
      });
    }

    // Calculate stats
    const scores = tests.map(t => t.score);
    const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / tests.length) * 100) / 100;
    const medianScore = scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)];
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Question performance
    const questionStats = {};
    tests.forEach(test => {
      test.responses.forEach((response, idx) => {
        if (!questionStats[response.questionId._id]) {
          questionStats[response.questionId._id] = {
            _id: response.questionId._id,
            question: response.questionId.question,
            correct: 0,
            total: 0,
          };
        }
        questionStats[response.questionId._id].total++;
        if (response.isCorrect) {
          questionStats[response.questionId._id].correct++;
        }
      });
    });

    const topQuestions = Object.values(questionStats)
      .map(q => ({
        ...q,
        correctPercentage: Math.round((q.correct / q.total) * 100),
      }))
      .sort((a, b) => b.correctPercentage - a.correctPercentage)
      .slice(0, 5);

    const difficultQuestions = Object.values(questionStats)
      .map(q => ({
        ...q,
        correctPercentage: Math.round((q.correct / q.total) * 100),
      }))
      .sort((a, b) => a.correctPercentage - b.correctPercentage)
      .slice(0, 5);

    res.json({
      quizId: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      totalSubmissions: tests.length,
      averageScore,
      medianScore,
      highestScore,
      lowestScore,
      topQuestions: topQuestions.map(({ _id, question, correctPercentage }) => ({
        questionId: _id,
        question,
        correctPercentage,
      })),
      difficultQuestions: difficultQuestions.map(({ _id, question, correctPercentage }) => ({
        questionId: _id,
        question,
        correctPercentage,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportResults = async (req, res) => {
  try {
    const { quizId, format = 'csv' } = req.query;
    const teacherId = req.userId;

    // Verify quiz ownership
    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.teacherId.toString() !== teacherId) {
      return res.status(403).json({ error: 'Not authorized to export this quiz' });
    }

    // Get all test submissions
    const tests = await Test.find({
      quizId,
      status: 'submitted',
    });

    if (format === 'csv') {
      const csv = [
        ['Student Name', 'Email', 'Score', 'Total Marks', 'Percentage', 'Passed', 'Completed At'].join(','),
        ...tests.map(t => [
          t.studentName || 'Anonymous',
          t.studentEmail || 'N/A',
          t.score,
          t.responses.length,
          t.percentage,
          t.percentage >= 50 ? 'Yes' : 'No',
          t.completedAt.toISOString(),
        ].join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="results-${quizId}.csv"`);
      res.send(csv);
    } else if (format === 'json') {
      res.json({
        quiz: {
          id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
        },
        results: tests.map(t => ({
          studentName: t.studentName,
          studentEmail: t.studentEmail,
          score: t.score,
          totalMarks: t.responses.length,
          percentage: t.percentage,
          completedAt: t.completedAt,
        })),
      });
    } else {
      res.status(400).json({ error: 'Invalid format. Use csv or json' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.userId;

    // Verify quiz ownership
    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.teacherId.toString() !== teacherId) {
      return res.status(403).json({ error: 'Not authorized to view this quiz' });
    }

    // Get all test submissions for this quiz
    const tests = await Test.find({
      quizId,
    }).select('_id studentName studentEmail score percentage status completedAt startedAt totalTime')
      .sort({ completedAt: -1 });

    const submissions = tests.map(t => ({
      testId: t._id,
      studentName: t.studentName || 'Anonymous',
      studentEmail: t.studentEmail || 'N/A',
      score: t.score || 0,
      percentage: t.percentage || 0,
      status: t.status,
      completedAt: t.completedAt,
      startedAt: t.startedAt,
      totalTime: t.totalTime,
    }));

    res.json({
      quizId: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      totalSubmissions: tests.filter(t => t.status === 'submitted').length,
      submissions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
