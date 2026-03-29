'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import MobileTestView from '@/components/MobileTestView';
import MCQQuestion from '@/components/MCQQuestion';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';
import Button from '@/components/Button';

interface TestQuestion {
  _id: string;
  question: string;
  options: string[];
}

interface TestData {
  quizTitle: string;
  duration: number;
  totalQuestions: number;
  questions: TestQuestion[];
}

interface TestSession {
  testId: string;
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const rawLink = params.link;
  const testLink = Array.isArray(rawLink) ? rawLink[0] : rawLink;

  const [test, setTest] = useState<TestData | null>(null);
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    if (testLink) {
      fetchTest();
    }
  }, [testLink]);

  const fetchTest = async () => {
    try {
      const response = await apiCall(`/tests/${testLink}`);
      setTest(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!studentName || !studentEmail) {
      setError('Please enter your name and email');
      return;
    }

    try {
      const response = await apiCall(`/tests/${testLink}/start`, {
        method: 'POST',
        body: JSON.stringify({ studentName, studentEmail }),
      });
      setTestSession(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start test');
    }
  };

  const handleSelectOption = async (optionIndex: number) => {
    if (!test || !testSession?.testId) {
      return;
    }

    const currentQuestion = test.questions[currentQuestionIdx];
    setResponses(prev => ({ ...prev, [currentQuestion._id]: optionIndex }));

    // Submit response to backend
    try {
      await apiCall(`/tests/${testSession.testId}/submit-response`, {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion._id,
          selectedOptionIndex: optionIndex,
          timeSpent: 0,
        }),
      });
    } catch (err: unknown) {
      console.error('Error submitting response:', err);
    }
  };

  const handleSubmitTest = useCallback(async () => {
    if (!testSession?.testId) {
      return;
    }

    setSubmitting(true);
    try {
      await apiCall(`/tests/${testSession.testId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ tabSwitchCount }),
      });

      localStorage.setItem('lastTestId', testSession.testId);
      router.replace(`/results?testId=${testSession.testId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  }, [router, tabSwitchCount, testSession]);

  // IMPORTANT: All hooks must be called BEFORE any conditional returns
  // Anti-cheating: detect tab/window switches
  useEffect(() => {
    if (!testSession) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        
        if (newCount >= 3) {
          alert('⚠️ Test will auto-submit due to multiple tab switches');
          handleSubmitTest();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testSession, tabSwitchCount, handleSubmitTest]);

  // Best-effort anti-capture controls. Note: browsers cannot fully prevent screenshots.
  useEffect(() => {
    if (!testSession) return;

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const handleCopyLikeEvents = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isDevToolsCombo = event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key);
      const isSourceViewCombo = event.ctrlKey && key === 'u';
      const isPrintScreen = event.key === 'PrintScreen';

      if (isDevToolsCombo || isSourceViewCombo || isPrintScreen || event.key === 'F12') {
        event.preventDefault();
        setError('Screen capture and inspection shortcuts are disabled during the test.');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyLikeEvents);
    document.addEventListener('cut', handleCopyLikeEvents);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyLikeEvents);
      document.removeEventListener('cut', handleCopyLikeEvents);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [testSession]);

  // Timer
  useEffect(() => {
    if (!testSession) return;

    setTimeRemaining((test?.duration ?? 0) * 60);
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testSession, test?.duration, handleSubmitTest]);

  if (loading) return <LoadingSpinner message="Loading test..." />;
  if (error) return <Alert type="error" message={error} />;

  // Before test starts - student info form
  if (!testSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="card w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2">{test?.quizTitle}</h1>
          <p className="text-gray-600 mb-6">
            Duration: {test?.duration} minutes | Total Questions: {test?.totalQuestions}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Your Email</label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-field w-full"
              />
            </div>

            <Button onClick={handleStartTest} className="w-full">
              Start Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // During test - use mobile-optimized view on mobile devices
  const currentQuestion = test?.questions[currentQuestionIdx];
  const totalQuestions = test?.totalQuestions ?? 0;
  const questionCount = test?.questions.length ?? 0;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentQuestionIdx + 1) / totalQuestions) * 100) : 0;
  const isLastQuestion = questionCount > 0 && currentQuestionIdx === questionCount - 1;
  const isFirstQuestion = currentQuestionIdx === 0;

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Mobile view
  if (isMobile && currentQuestion) {
    return (
      <div className="relative">
        <div className="pointer-events-none fixed inset-0 z-40 select-none opacity-10">
          <div className="h-full w-full [background-image:repeating-linear-gradient(-30deg,transparent,transparent_180px,rgba(0,0,0,0.18)_180px,rgba(0,0,0,0.18)_220px)]" />
        </div>
        <MobileTestView
          questionNumber={currentQuestionIdx + 1}
          totalQuestions={totalQuestions}
          question={currentQuestion.question}
          options={currentQuestion.options}
          selectedOption={responses[currentQuestion._id] ?? null}
          onSelectOption={handleSelectOption}
          onNext={() => setCurrentQuestionIdx(prev => prev + 1)}
          onPrevious={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
          onSubmit={handleSubmitTest}
          timeRemaining={timeRemaining}
          isLastQuestion={isLastQuestion}
          isFirstQuestion={isFirstQuestion}
        />
      </div>
    );
  }

  // Desktop view - original layout
  return (
    <div className="relative min-h-screen bg-gray-50 p-4">
      <div className="pointer-events-none fixed inset-0 z-40 select-none opacity-10">
        <div className="h-full w-full [background-image:repeating-linear-gradient(-30deg,transparent,transparent_180px,rgba(0,0,0,0.18)_180px,rgba(0,0,0,0.18)_220px)]" />
      </div>
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Question {currentQuestionIdx + 1} of {totalQuestions}</span>
            <span className="text-gray-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <MCQQuestion
            questionNumber={currentQuestionIdx + 1}
            question={currentQuestion.question}
            options={currentQuestion.options}
            selectedOption={responses[currentQuestion._id] ?? null}
            onSelectOption={handleSelectOption}
          />
        )}

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
            variant="secondary"
            disabled={currentQuestionIdx === 0}
          >
            ← Previous
          </Button>

          {isLastQuestion ? (
            <Button onClick={handleSubmitTest} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
              disabled={currentQuestionIdx === totalQuestions - 1}
            >
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
