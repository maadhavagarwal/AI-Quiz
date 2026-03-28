// Dark mode toggle component
'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme preference from localStorage
    const saved = localStorage.getItem('theme');
    if (saved) {
      setIsDark(saved === 'dark');
      applyTheme(saved === 'dark');
    }
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    applyTheme(newDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      title="Toggle dark mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
