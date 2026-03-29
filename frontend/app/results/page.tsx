'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiCall } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';
import Button from '@/components/Button';

interface ResultReview {
  question: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
}

interface TestResults {
  studentName: string;
  score: number;
  totalMarks: number;
  percentage?: number;
  responses?: ResultReview[];
}

function ResultsContent() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const testId = searchParams.get('testId') || localStorage.getItem('lastTestId');
      if (!testId) {
        setError('No test results found');
        setLoading(false);
        return;
      }

      const response = await apiCall(`/tests/${testId}/results`);
      setResults(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading results..." />;
  if (error) return <Alert type="error" message={error} />;
  if (!results) return <Alert type="error" message="No results found" />;

  const percentage = Number(results.percentage ?? ((results.score / results.totalMarks) * 100).toFixed(1));
  const passed = percentage >= 40;

  const handleExit = () => {
    try {
      localStorage.removeItem('lastTestId');
      window.open('about:blank', '_self');
      window.close();
    } catch {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Score Card */}
        <div className={`card text-center mb-6 border-t-4 ${passed ? 'border-green-500' : 'border-red-500'}`}>
          <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? '✅' : '❌'}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Try Again'}
          </h1>
          <p className="text-gray-600 mb-6">
            {results.studentName}
          </p>

          {/* Score Display */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-3xl font-bold text-blue-600">{results.score}</div>
              <p className="text-sm text-gray-600">Score</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{percentage}%</div>
              <p className="text-sm text-gray-600">Percentage</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{results.score}</div>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Score Progress</span>
              <span className="text-sm text-gray-600">Passing: 40%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => router.replace('/results')} variant="secondary" className="w-full">
              Refresh
            </Button>
            <Button onClick={handleExit} className="w-full">
              Exit
            </Button>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Detailed Results</h2>
          
          {results.responses && results.responses.length > 0 ? (
            <div className="space-y-4">
              {results.responses.map((review, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 pl-4 py-3 ${
                    review.isCorrect ? 'border-green-500' : 'border-red-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xl ${review.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {review.isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{idx + 1}. {review.question}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your answer: {review.selectedOption}
                      </p>
                      {!review.isCorrect && (
                        <p className="text-sm text-green-600">
                          Correct answer: {review.correctOption}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No detailed review available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading results..." />}>
      <ResultsContent />
    </Suspense>
  );
}
