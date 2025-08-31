import React, { useRef, useEffect } from 'react';
import { Paperclip } from 'lucide-react';

interface SimpleMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  isWelcomeScreen?: boolean;
  onAttachClick?: () => void;
}

const SimpleMessageInput: React.FC<SimpleMessageInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onSubmit,
  placeholder = 'Message BrainSwitch...',
  isWelcomeScreen = false,
  onAttachClick
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
    <form onSubmit={onSubmit} className="relative">
      <div className="relative shadow-lg rounded-3xl overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`w-full ${isWelcomeScreen ? 'px-6 py-4 pl-14 pr-14' : 'px-5 py-3 pl-12 pr-12'} border-2 border-gray-200 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500`}
          rows={1}
          style={{ 
            minHeight: isWelcomeScreen ? '64px' : '52px', 
            maxHeight: isWelcomeScreen ? '200px' : '120px' 
          }}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {/* Attachment Button */}
        {onAttachClick && (
          <button
            type="button"
            onClick={onAttachClick}
            className={`absolute ${isWelcomeScreen ? 'left-4 bottom-4' : 'left-3 bottom-3'} p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700`}
            title="Attach files"
          >
            <Paperclip className={isWelcomeScreen ? "h-5 w-5" : "h-4 w-4"} />
          </button>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`absolute ${isWelcomeScreen ? 'right-4 bottom-4' : 'right-3 bottom-3'} p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors`}
          title="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isWelcomeScreen ? "h-5 w-5" : "h-4 w-4"}
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default SimpleMessageInput;