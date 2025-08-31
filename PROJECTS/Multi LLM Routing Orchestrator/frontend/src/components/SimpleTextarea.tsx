import React, { useRef, useState, useEffect } from 'react';

interface SimpleTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  style?: React.CSSProperties;
  isWelcomeScreen?: boolean;
}

const SimpleTextarea: React.FC<SimpleTextareaProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder = '',
  className = '',
  rows = 1,
  style = {},
  isWelcomeScreen = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, isWelcomeScreen ? 200 : 120) + 'px';
    }
  }, [value, isWelcomeScreen]);

  // Handle change event
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
      rows={rows}
      style={style}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );
};

export default SimpleTextarea;