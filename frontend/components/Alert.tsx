'use client';

import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`border-l-4 p-4 rounded ${bgColors[type]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-bold mr-3">{icons[type]}</span>
          <span>{message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 font-bold hover:opacity-75"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
