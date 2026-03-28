'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { FormEvent } from 'react';
import { apiCall } from '@/lib/api';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';

interface QuizQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface QuizData {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  totalmarks: number;
  duration: number;
  totalQuestions: number;
  isPublished: boolean;
  questions: QuizQuestion[];
  extractedText?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error occurred';
}

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const rawQuizId = params.id;
  const quizId = Array.isArray(rawQuizId) ? rawQuizId[0] : rawQuizId;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [inputText, setInputText] = useState('');
  const [initialNumberOfQuestions, setInitialNumberOfQuestions] = useState(10);
  const [moreQuestionsToAdd, setMoreQuestionsToAdd] = useState(0);
  const [liveGeneratedCount, setLiveGeneratedCount] = useState(0);
  const [generationTarget, setGenerationTarget] = useState(0);
  const [hasQuestionsGenerated, setHasQuestionsGenerated] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await apiCall(`/quizzes/${quizId}`);
      setQuiz(response);
      setError(''); // Clear any previous errors
      
      // Auto-populate with extracted text from uploaded files
      if (response.extractedText && response.extractedText.trim()) {
        setInputText(response.extractedText);
      }

      // Check if questions have already been generated
      if (response.questions && response.questions.length > 0) {
        setHasQuestionsGenerated(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setLiveGeneratedCount(0);

    const questionsToGenerate = hasQuestionsGenerated ? moreQuestionsToAdd : initialNumberOfQuestions;

    if (!hasQuestionsGenerated && questionsToGenerate <= 0) {
      setError('Please enter number of questions to generate');
      setGenerating(false);
      return;
    }

    if (hasQuestionsGenerated && moreQuestionsToAdd <= 0) {
      setError('Please enter how many more questions to add');
      setGenerating(false);
      return;
    }

    setGenerationTarget(questionsToGenerate);

    try {
      // Use typed text first, fall back to extracted text from uploaded files
      const materialText = inputText.trim() || quiz?.extractedText?.trim() || '';
      if (!materialText) {
        throw new Error('Please enter study material or upload notes to this quiz first');
      }

      let generatedTotal = 0;
      const batchSize = 2;

      while (generatedTotal < questionsToGenerate) {
        const remaining = questionsToGenerate - generatedTotal;
        const currentBatch = Math.min(batchSize, remaining);

        const response = await apiCall('/questions/generate', {
          method: 'POST',
          body: JSON.stringify({
            quizId,
            text: materialText,
            numberOfQuestions: currentBatch,
          }),
        });

        const generatedNow = response.totalGenerated || 0;
        generatedTotal += generatedNow;
        setLiveGeneratedCount(generatedTotal);

        // Refresh after each batch so question list and counts update progressively.
        await fetchQuiz();

        if (generatedNow === 0) {
          break;
        }
      }

      const messageType = hasQuestionsGenerated ? 'added' : 'generated';
      alert(`✅ Successfully ${messageType} ${generatedTotal} questions!`);
      setMoreQuestionsToAdd(0);
      setHasQuestionsGenerated(true);
      await fetchQuiz();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishQuiz = async () => {
    if (!quiz?.questions?.length) {
      setError('Add questions before publishing');
      return;
    }

    try {
      await apiCall(`/quizzes/${quizId}/publish`, { method: 'POST' });
      alert('✅ Quiz published successfully!');
      fetchQuiz();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner message="Loading quiz..." />;
  if (!quiz) return <Alert type="error" message="Quiz not found" />;

  const questionList = quiz.questions ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.description}</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Quiz Info */}
          <div className="md:col-span-1">
            <div className="card">
              <h3 className="font-bold mb-3">Quiz Info</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Subject:</strong> {quiz?.subject}</p>
                <p><strong>Total Marks:</strong> {quiz.totalmarks}</p>
                <p><strong>Duration:</strong> {quiz.duration} min</p>
                <p><strong>Questions:</strong> {quiz.totalQuestions || 0}</p>
                <p><strong>Status:</strong> {quiz.isPublished ? '✓ Published' : '📝 Draft'}</p>
              </div>

              {!quiz.isPublished && (
                <Button 
                  onClick={handlePublishQuiz}
                  className="w-full mt-4"
                  disabled={questionList.length === 0}
                >
                  Publish Quiz
                </Button>
              )}
            </div>
          </div>

          {/* Question Generator */}
          <div className="md:col-span-2">
            <div className="card mb-6">
              <h3 className="font-bold mb-4">🤖 Generate Questions with AI</h3>
              {generating && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                  <p className="font-semibold text-blue-700">Generating questions...</p>
                  <p className="text-blue-600">Live Count: {liveGeneratedCount} / {generationTarget}</p>
                </div>
              )}
              <form onSubmit={handleGenerateQuestions} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Study Material / Notes
                    </label>
                    {quiz?.extractedText && !inputText && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        📎 Using uploaded notes
                      </span>
                    )}
                  </div>
                  <TextInput
                    value={inputText}
                    onChange={setInputText}
                    placeholder={quiz?.extractedText ? '(Using uploaded notes - modify or add more text)' : 'Paste your study material, book excerpt, or notes here...'}
                    rows={6}
                  />
                </div>

                {!hasQuestionsGenerated ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Number of Questions to Generate
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={initialNumberOfQuestions}
                      onChange={(e) => setInitialNumberOfQuestions(parseInt(e.target.value) || 10)}
                      className="input-field w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Generate MCQ questions from your study material</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      📊 Current Questions: <span className="text-blue-600">{questionList.length}</span>
                    </label>
                    <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-gray-700">Add more questions with a mixture of answers to your quiz</p>
                    </div>
                    <label className="block text-sm font-medium mb-1">
                      How Many More Questions to Add?
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={moreQuestionsToAdd}
                      onChange={(e) => setMoreQuestionsToAdd(parseInt(e.target.value) || 0)}
                      className="input-field w-full"
                      placeholder="e.g., 5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Generate additional MCQ questions to add to your quiz</p>
                  </div>
                )}

                <Button type="submit" disabled={generating} className="w-full">
                  {generating 
                    ? `${hasQuestionsGenerated ? 'Adding' : 'Generating'}... (${liveGeneratedCount}/${generationTarget})`
                    : hasQuestionsGenerated 
                    ? '➕ Add More Questions' 
                    : '✨ Generate Questions'
                  }
                </Button>
              </form>
            </div>

            {/* Generated Questions Preview */}
            <div className="card">
              <h3 className="font-bold mb-4">Generated Questions ({questionList.length})</h3>
              {questionList.length > 0 ? (
                <div className="space-y-4">
                  {questionList.map((q: QuizQuestion, idx: number) => (
                    <div key={q._id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-medium">{idx + 1}. {q.question}</p>
                      <div className="text-sm mt-2 space-y-1">
                        {q.options.map((opt: string, i: number) => (
                          <p key={i} className="text-gray-600">
                            {String.fromCharCode(65 + i)}) {opt}
                            {i === q.correctAnswerIndex && ' ✓'}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No questions yet. Generate your first questions above!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
