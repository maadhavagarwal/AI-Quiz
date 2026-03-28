'use client';

import React, { useState } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  rows = 5,
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="input-field w-full resize-vertical font-mono text-sm"
  />
);

export default TextInput;
