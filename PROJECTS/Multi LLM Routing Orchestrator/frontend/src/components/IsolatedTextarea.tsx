import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react'

interface IsolatedTextareaProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
  rows?: number
  style?: React.CSSProperties
  isWelcomeScreen?: boolean
}

// Completely isolated textarea component that won't lose focus
const IsolatedTextarea = memo(({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder = '', 
  className = '', 
  rows = 1, 
  style = {},
  isWelcomeScreen = false
}: IsolatedTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localValue, setLocalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const lastChangeRef = useRef(Date.now())
  
  // Sync with parent value when it changes externally (like on submit)
  useEffect(() => {
    // Only sync if the parent value is different and we haven't just updated it ourselves
    // This prevents any interference with typing specific words like 'continue'
    if (value !== localValue && Date.now() - lastChangeRef.current > 200) {
      setLocalValue(value)
    }
  }, [value, localValue])

  // Direct change handler without debouncing to ensure immediate updates
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    lastChangeRef.current = Date.now()
    
    // Immediately update local state for responsive typing
    setLocalValue(newValue)
    
    // Auto-resize immediately without causing re-renders
    const target = e.target
    requestAnimationFrame(() => {
      target.style.height = 'auto'
      target.style.height = Math.min(target.scrollHeight, isWelcomeScreen ? 200 : 120) + 'px'
    })
    
    // Clear any pending timeouts
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Update parent state immediately without debounce
    onChange(newValue)
  }, [])
  
  // Handle input event directly to ensure all characters are captured
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    const newValue = target.value
    
    // Update local state immediately
    setLocalValue(newValue)
    
    // Update parent state immediately
    onChange(newValue)
  }, [onChange])

  // Forward key events with no dependencies to prevent re-renders
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e)
  }, [])
  
  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Force focus to remain in the textarea when typing
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Add a click handler to ensure focus is maintained
      const handleClick = () => {
        textarea.focus()
      }
      
      textarea.addEventListener('click', handleClick)
      return () => {
        textarea.removeEventListener('click', handleClick)
      }
    }
  }, [])

  return (
    <textarea
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      rows={rows}
      style={style}
      // Add additional props to ensure focus is maintained
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
    />
  )
})

IsolatedTextarea.displayName = 'IsolatedTextarea'

export default IsolatedTextarea
