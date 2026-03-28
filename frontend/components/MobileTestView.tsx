// Mobile-optimized test view component
'use client';

import { useState, useEffect } from 'react';

interface MobileTestViewProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: string[];
  selectedOption: number | null;
  onSelectOption: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  timeRemaining?: number;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
}

export default function MobileTestView({
  questionNumber,
  totalQuestions,
  question,
  options,
  selectedOption,
  onSelectOption,
  onNext,
  onPrevious,
  onSubmit,
  timeRemaining = 0,
  isLastQuestion,
  isFirstQuestion,
}: MobileTestViewProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSwipeLeft = () => {
    if (!isLastQuestion) onNext();
  };

  const handleSwipeRight = () => {
    if (!isFirstQuestion) onPrevious();
  };

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [fullscreen]);

  return (
    <div className="min-h-screen bg-gray-50 md:p-4 flex flex-col">
      {/* Header - sticky on mobile */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Question {questionNumber}/{totalQuestions}
          </p>
          <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {timeRemaining > 0 && (
          <div className="text-center">
            <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-xs text-gray-600">remaining</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-32 overflow-y-auto">
        {/* Question */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-6 text-gray-900">
            {question}
          </h2>

          {/* Options - large tap targets for mobile */}
          <div className="space-y-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => onSelectOption(index)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all active:scale-95 ${
                  selectedOption === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span className="flex items-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold mr-3 ${
                      selectedOption === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-base">{option}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons - fixed on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-2">
        {/* Question Counter */}
        <p className="text-sm text-gray-600 text-center mb-2">
          {questionNumber} of {totalQuestions}
        </p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={isFirstQuestion}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-200"
          >
            ← Back
          </button>

          {isLastQuestion ? (
            <button
              onClick={onSubmit}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold active:bg-green-700"
            >
              Submit ✓
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={isLastQuestion}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700"
            >
              Next →
            </button>
          )}
        </div>

        {/* Fullscreen toggle on mobile */}
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="w-full py-2 text-sm bg-gray-50 text-gray-700 rounded-lg"
        >
          {fullscreen ? '⬇ Exit Fullscreen' : '⬆ Fullscreen Mode'}
        </button>
      </div>
    </div>
  );
}
