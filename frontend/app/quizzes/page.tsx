'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth');
      return;
    }
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await apiCall('/quizzes?limit=100');
      setQuizzes(response.quizzes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await apiCall(`/quizzes/${quizId}`, { method: 'DELETE' });
      setQuizzes(quizzes.filter(q => q._id !== quizId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading quizzes..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">📚 My Quizzes</h1>
          <div className="space-x-4">
            <Link href="/dashboard">
              <Button variant="secondary">Dashboard</Button>
            </Link>
            <Link href="/quiz/new">
              <Button>+ New Quiz</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {quizzes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map(quiz => (
              <div key={quiz._id} className="card hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1">{quiz.title}</h3>
                  <p className="text-sm text-gray-600">{quiz.subject}</p>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>📝 {quiz.totalQuestions} questions</p>
                  <p>⏱️ {quiz.duration} minutes</p>
                  <p>📊 {quiz.isPublished ? '✓ Published' : '🔒 Draft'}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Link href={`/quiz/${quiz._id}/edit`} className="flex-1">
                    <Button className="w-full">Edit</Button>
                  </Link>
                  {quiz.isPublished && (
                    <Link href={`/quiz/${quiz._id}/share`} className="flex-1">
                      <Button variant="secondary" className="w-full">Share</Button>
                    </Link>
                  )}
                  <button
                    onClick={() => handleDeleteQuiz(quiz._id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-gray-600 mb-4">No quizzes created yet.</p>
            <Link href="/quiz/new">
              <Button>Create Your First Quiz</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
