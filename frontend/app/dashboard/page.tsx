'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';

interface TeacherProfile {
  name: string;
}

interface RecentQuiz {
  _id: string;
  title: string;
  subject: string;
  totalQuestions: number;
  isPublished: boolean;
}

interface DashboardAnalytics {
  totalQuizzes: number;
  totalQuestions: number;
  totalStudents: number;
  averageScore: number;
  recentQuizzes: RecentQuiz[];
}

export default function Dashboard() {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [profileRes, analyticsRes] = await Promise.all([
        apiCall('/auth/profile'),
        apiCall('/dashboard/analytics'),
      ]);

      setTeacher(profileRes);
      setAnalytics(analyticsRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('teacher');
    router.push('/');
  };

  const recentQuizzes = analytics?.recentQuizzes ?? [];

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">📊 Dashboard</h1>
          <div className="space-x-4">
            <span className="text-gray-600">{teacher?.name}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && <Alert type="error" message={error} />}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="text-3xl font-bold text-blue-600">{analytics?.totalQuizzes || 0}</div>
            <p className="text-gray-600 text-sm mt-2">Total Quizzes</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-green-600">{analytics?.totalQuestions || 0}</div>
            <p className="text-gray-600 text-sm mt-2">Questions Created</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-purple-600">{analytics?.totalStudents || 0}</div>
            <p className="text-gray-600 text-sm mt-2">Students Tested</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-orange-600">{analytics?.averageScore?.toFixed(1) || 0}%</div>
            <p className="text-gray-600 text-sm mt-2">Avg. Score</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <Link href="/quiz/new">
              <Button>+ Create New Quiz</Button>
            </Link>
            <Link href="/quizzes">
              <Button variant="secondary">View All Quizzes</Button>
            </Link>
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Quizzes</h2>
          {recentQuizzes.length > 0 ? (
            <div className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <div key={quiz._id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="font-semibold">{quiz.title}</div>
                  <div className="text-sm text-gray-600">
                    {quiz.subject} • {quiz.totalQuestions} questions • 
                    {quiz.isPublished ? ' ✓ Published' : ' 📝 Draft'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No quizzes yet. Create your first quiz!</p>
          )}
        </div>
      </div>
    </div>
  );
}
