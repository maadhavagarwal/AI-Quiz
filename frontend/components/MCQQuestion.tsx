'use client';

import React, { useState } from 'react';

interface MCQQuestionProps {
  questionNumber: number;
  question: string;
  options: string[];
  selectedOption: number | null;
  onSelectOption: (index: number) => void;
  isReviewMode?: boolean;
  correctAnswerIndex?: number;
}

export const MCQQuestion: React.FC<MCQQuestionProps> = ({
  questionNumber,
  question,
  options,
  selectedOption,
  onSelectOption,
  isReviewMode = false,
  correctAnswerIndex,
}) => {
  return (
    <div className="card mb-6">
      <h3 className="text-lg font-bold mb-4">
        Question {questionNumber}: {question}
      </h3>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = isReviewMode && index === correctAnswerIndex;
          const isWrong = isReviewMode && isSelected && index !== correctAnswerIndex;

          let bgColor = 'bg-white border-gray-300';
          if (isCorrect) bgColor = 'bg-green-50 border-green-500';
          if (isWrong) bgColor = 'bg-red-50 border-red-500';
          if (isSelected && !isReviewMode) bgColor = 'bg-blue-50 border-blue-500';

          return (
            <label
              key={index}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${bgColor}`}
            >
              <input
                type="radio"
                name={`question-${questionNumber}`}
                value={index}
                checked={isSelected}
                onChange={() => !isReviewMode && onSelectOption(index)}
                disabled={isReviewMode}
                className="w-4 h-4"
              />
              <span className="ml-3 text-gray-700">{option}</span>
              {isCorrect && <span className="ml-auto text-green-600 font-bold">✓ Correct</span>}
              {isWrong && <span className="ml-auto text-red-600 font-bold">✗ Wrong</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default MCQQuestion;
