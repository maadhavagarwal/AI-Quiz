'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';

interface QuizData {
  _id: string;
  title: string;
  description?: string;
  totalQuestions: number;
  duration: number;
  totalmarks: number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error occurred';
}

export default function ShareTestPage() {
  const params = useParams();
  const router = useRouter();
  const rawQuizId = params.id;
  const quizId = Array.isArray(rawQuizId) ? rawQuizId[0] : rawQuizId;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testLink, setTestLink] = useState('');
  const [testLinkCode, setTestLinkCode] = useState('');

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await apiCall(`/quizzes/${quizId}`);
      setQuiz(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTestLink = async () => {
    try {
      setError('');
      const response = await apiCall(`/tests/generate-link`, {
        method: 'POST',
        body: JSON.stringify({ quizId }),
      });

      const code = response.uniqueCode || response.linkCode || '';
      setTestLinkCode(code);

      const link = response.testLink || `${window.location.origin}/test/${code}`;
      setTestLink(link);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(testLink);
    alert('✓ Link copied to clipboard!');
  };

  if (loading) return <LoadingSpinner message="Loading quiz..." />;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-2">{quiz?.title}</h1>
          <p className="text-gray-600">{quiz?.description}</p>
        </div>

        {testLink ? (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">✅ Test Link Generated</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Test Link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white"
                />
                <Button onClick={handleCopyLink}>Copy</Button>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Or share the code:</p>
              <div className="text-3xl font-bold text-green-600 text-center py-4">
                {testLinkCode}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <h3 className="font-bold">📋 Instructions for Students:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Visit the test link or enter the code above</li>
                <li>Enter your name and email</li>
                <li>Answer all {quiz?.totalQuestions} questions</li>
                <li>Submit the test to view results immediately</li>
              </ol>
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="secondary" onClick={() => setTestLink('')} className="flex-1">
                Generate New Link
              </Button>
              <Button onClick={() => router.back()} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Generate Test Link</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                📌 Share this test with your students so they can take the quiz
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Quiz Details</label>
                <div className="space-y-2 text-sm">
                  <p>Title: <span className="font-semibold">{quiz?.title}</span></p>
                  <p>Questions: <span className="font-semibold">{quiz?.totalQuestions}</span></p>
                  <p>Duration: <span className="font-semibold">{quiz?.duration} minutes</span></p>
                  <p>Total Marks: <span className="font-semibold">{quiz?.totalmarks}</span></p>
                </div>
              </div>
            </div>

            <Button onClick={handleGenerateTestLink} className="w-full">
              🔗 Generate Test Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
