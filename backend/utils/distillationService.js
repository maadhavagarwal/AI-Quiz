import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';

const DISTILLABLE_PROVIDERS = ['custom', 'gemini', 'groq', 'ollama', 'hybrid', 'mixed'];

function computeQuality(question) {
  const attempts = question?.trainingStats?.attempts || 0;
  const correct = question?.trainingStats?.correct || 0;
  const approvalBoost = question?.isApproved ? 0.2 : 0;

  if (attempts === 0) {
    return Number((0.5 + approvalBoost).toFixed(4));
  }

  const accuracy = correct / attempts;
  const engagementBoost = Math.min(0.2, attempts / 200);
  return Number(Math.min(1, accuracy + approvalBoost + engagementBoost).toFixed(4));
}

export async function recordQuestionOutcome(questionId, isCorrect, timeSpent = 0) {
  if (!questionId) return;

  const increment = {
    'trainingStats.attempts': 1,
    'trainingStats.correct': isCorrect ? 1 : 0,
    'trainingStats.incorrect': isCorrect ? 0 : 1,
    'trainingStats.totalTimeSpent': Number(timeSpent) > 0 ? Number(timeSpent) : 0,
  };

  const updated = await Question.findByIdAndUpdate(
    questionId,
    {
      $inc: increment,
      $set: { 'trainingStats.lastEvaluatedAt': new Date() },
    },
    { new: true }
  );

  if (!updated) return;

  const quality = computeQuality(updated);
  await Question.findByIdAndUpdate(updated._id, {
    $set: {
      distillationQualityScore: quality,
      distilledFromLLM: DISTILLABLE_PROVIDERS.includes(updated.generatedBy),
    },
  });
}

export async function markQuestionAsDistilled(questionId) {
  const question = await Question.findById(questionId);
  if (!question) return;

  const quality = computeQuality(question);
  await Question.findByIdAndUpdate(questionId, {
    $set: {
      distilledFromLLM: DISTILLABLE_PROVIDERS.includes(question.generatedBy),
      distillationQualityScore: quality,
    },
  });
}

export async function getDistilledGuidance({ subject, difficulty = 'medium', maxExamples = 3 } = {}) {
  const baseQuery = {
    isApproved: true,
    distilledFromLLM: true,
  };

  const candidates = await Question.find(baseQuery)
    .sort({ distillationQualityScore: -1, 'trainingStats.attempts': -1, createdAt: -1 })
    .limit(60)
    .lean();

  if (!candidates.length) {
    return { guidanceText: '', examples: [] };
  }

  let scopedCandidates = candidates;

  if (subject) {
    const quizzes = await Quiz.find({ subject }).select('_id').lean();
    const allowedQuizIds = new Set(quizzes.map((q) => String(q._id)));
    const bySubject = candidates.filter((c) => allowedQuizIds.has(String(c.quizId)));
    if (bySubject.length > 0) {
      scopedCandidates = bySubject;
    }
  }

  if (difficulty) {
    const byDifficulty = scopedCandidates.filter((c) => c.difficulty === difficulty);
    if (byDifficulty.length > 0) {
      scopedCandidates = byDifficulty;
    }
  }

  const selected = scopedCandidates.slice(0, Math.max(1, Math.min(maxExamples, 5)));

  const guidanceText = selected.map((q, idx) => {
    const accuracy = q.trainingStats?.attempts
      ? Math.round((q.trainingStats.correct / q.trainingStats.attempts) * 100)
      : null;
    const perfLabel = accuracy === null ? 'no student stats yet' : `${accuracy}% student correctness`;

    return [
      `Example ${idx + 1}:`,
      `Question style: ${q.question}`,
      `Correct option index: ${q.correctAnswerIndex}`,
      `Reasoning style: ${q.explanation}`,
      `Observed performance: ${perfLabel}`,
    ].join('\n');
  }).join('\n\n');

  return { guidanceText, examples: selected };
}
