import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, ArrowUp, Paperclip, X, FileText, Image, File } from 'lucide-react'
import { useChatStore, Message } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'
import { llmApi } from '../services/api'
import { useQuery } from 'react-query'
import AgentCards from '../components/AgentCards'
import SimpleTextarea from '../components/SimpleTextarea'
import SimpleMessageInput from '../components/SimpleMessageInput'

const LandingPage = () => {
  const {
    messages,
    addMessage,
    isLoading,
    setLoading,
    selectedModel,
    setSelectedModel,
    showChat,
    setShowChat,
    createSessionFromMessages
  } = useChatStore()

  const { user, checkAuth } = useAuthStore()
  const [inputValue, setInputValue] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch available models
  const { data: modelsData } = useQuery('models', llmApi.getModels)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles: File[] = []
      const rejectedFiles: string[] = []

      Array.from(files).forEach(file => {
        // Accept documents, images, and text files
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ]

        if (!allowedTypes.includes(file.type)) {
          rejectedFiles.push(`${file.name} (unsupported type: ${file.type})`)
        } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
          rejectedFiles.push(`${file.name} (too large: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
        } else {
          newFiles.push(file)
        }
      })

      if (rejectedFiles.length > 0) {
        // Show error message for rejected files
        const errorMessage: Omit<Message, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: `Some files were not uploaded:\n${rejectedFiles.map(f => `• ${f}`).join('\n')}\n\nSupported formats: PDF, Word documents, text files, CSV, Excel files, and images (JPG, PNG, GIF, WebP). Maximum size: 10MB per file.`
        }
        addMessage(errorMessage)
      }

      if (newFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...newFiles])
      }
    }
    // Reset input
    if (event.target) {
      event.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('word')) {
      return <FileText className="h-4 w-4" />
    } else {
      return <File className="h-4 w-4" />
    }
  }

  const processFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          if (file.type === 'application/pdf') {
            // For PDFs, we can't extract text in the browser without a library
            // So we'll just provide metadata and ask the AI to acknowledge the limitation
            resolve(`[PDF Document: ${file.name}, Size: ${(file.size / 1024).toFixed(1)}KB] - Note: PDF text extraction is not available in the browser. Please describe what you'd like me to help you with regarding this PDF file.`)
          } else if (file.type.includes('word') || file.type.includes('document')) {
            // For Word documents, similar limitation
            resolve(`[Word Document: ${file.name}, Size: ${(file.size / 1024).toFixed(1)}KB] - Note: Word document text extraction is not available in the browser. Please describe what you'd like me to help you with regarding this document.`)
          } else if (file.type === 'text/plain' || file.type === 'text/csv') {
            // For plain text files, we can read the content
            const content = e.target?.result as string
            resolve(`[Text File: ${file.name}]\n${content.substring(0, 5000)}${content.length > 5000 ? '\n... (truncated)' : ''}`)
          } else {
            // For other file types, provide metadata only
            resolve(`[File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(1)}KB] - Please describe what you'd like me to help you with regarding this file.`)
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`))
      }

      // Read files appropriately based on type
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        reader.readAsText(file)
      } else {
        // For binary files (PDF, Word, etc.), we'll just use metadata
        // Trigger onload immediately with file info
        setTimeout(() => {
          reader.onload?.({ target: { result: '' } } as any)
        }, 0)
      }
    })
  }

  const summarizeImagesAndPost = async (imageFiles: File[]) => {
    if (imageFiles.length === 0) return
    try {
      setLoading(true)
      const results = await Promise.all(
        imageFiles.map(async (file) => {
          try {
            const res = await llmApi.summarizeImage(file)
            // Expand caption into a structured, user-friendly summary via LLM
            const analysisPrompt = `You are an assistant that writes helpful, accurate image summaries.\n\nCaption: "${res.summary}"\n\nBased ONLY on this caption, produce a concise analysis with the following fields:\n- Title: (4-8 words)\n- One-sentence summary:\n- Key details: (3-6 short bullets)\n- Setting/environment:\n- People/objects & actions:\n- Quality/lighting notes (if any):\n- Tags: (5-10 short tags, comma-separated)\n\nDo not invent details beyond what a typical reading of the caption implies. Keep it compact and readable.`
            try {
              const ai = await llmApi.generate(analysisPrompt, undefined, 400, 0.3)
              return `${file.name}\n${ai.response}`
            } catch {
              return `${file.name}\nSummary: ${res.summary}`
            }
          } catch (err) {
            return `- ${file.name}: Failed to summarize`
          }
        })
      )

      const assistantMessage: Omit<Message, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: `Image analysis\n\n${results.join('\n\n')}`
      }
      addMessage(assistantMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return

    let messageContent = inputValue.trim()

    const imageFiles = attachedFiles.filter(f => f.type.startsWith('image/'))
    const otherFiles = attachedFiles.filter(f => !f.type.startsWith('image/'))

    // Process attached files
    if (otherFiles.length > 0) {
      try {
        const fileContents = await Promise.all(
          otherFiles.map(async (file) => {
            try {
              const content = await processFileContent(file)
              return `\n\n--- ${content}`
            } catch (error) {
              return `\n\n--- File: ${file.name} ---\n[Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}]`
            }
          })
        )

        if (!messageContent && fileContents.length > 0) {
          messageContent = "I've attached some files. Please help me with:"
        }
        messageContent += fileContents.join('')
      } catch (error) {
        const errorMessage: Omit<Message, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: `Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
        addMessage(errorMessage)
        return
      }
    }

    // If only images attached and no text, summarize and stop here
    if (imageFiles.length > 0 && !messageContent) {
      // Create a session if first interaction
      if (messages.length === 0 && user) {
        createSessionFromMessages(user.id)
      }
      await summarizeImagesAndPost(imageFiles)
      setAttachedFiles([])
      return
    }

    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      role: 'user',
      content: messageContent
    }

    addMessage(userMessage)

    // Create a session if this is the first message
    if (messages.length === 0 && user) {
      createSessionFromMessages(user.id)
    }

    setInputValue('')
    // If there are images along with text, summarize them first for convenience
    if (imageFiles.length > 0) {
      await summarizeImagesAndPost(imageFiles)
    }
    setAttachedFiles([])
    setLoading(true)

    try {
      // The backend will automatically detect if this is an image generation request
      const response = await llmApi.generate(
        messageContent,
        selectedModel || undefined,
        1000,
        temperature
      )

      const assistantMessage: Omit<Message, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: response.response,
        model: response.model,
        provider: response.provider,
        latency: response.latency_ms
      }

      addMessage(assistantMessage)
    } catch (error) {
      const errorMessage: Omit<Message, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`
      }
      addMessage(errorMessage)

      // If it's an authentication error, the API service will handle the redirect
      // But we can also check here for additional handling if needed
      if (error instanceof Error && error.message.includes('Session expired')) {
        // The redirect will happen automatically from the API service
        return
      }
    } finally {
      setLoading(false)
    }
  }

  // Use a ref to store the current input value to avoid stale closures
  const inputValueRef = useRef(inputValue)
  inputValueRef.current = inputValue

  // Completely isolated input change handler for the isolated component
  // Using a direct update approach without any filtering or conditions
  const handleInputChange = useCallback((newValue: string) => {
    // Direct update without any processing that might interfere with specific words like 'continue'
    setInputValue(newValue)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.closest('form')
      if (form) {
        form.requestSubmit()
      }
    }
  }, [])

  const handleAgentClick = () => {
    setShowChat(true)
  }

  // Auto-show chat if there's an active session or messages
  useEffect(() => {
    if (messages.length > 0) {
      setShowChat(true)
    }
  }, [messages.length, setShowChat])

  // Check authentication on component mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Helper function to get model display name
  const getModelDisplayName = (modelName: string) => {
    const displayNames: Record<string, string> = {
      'llama-3.1-8b-instant': 'Llama 3.1 8B (Fast)',
      'gemma2-9b-it': 'Gemma 2 9B (Smart)',
      'llama3-8b-8192': 'Llama 3 8B',
      'gemma-7b-it': 'Gemma 7B',
      'microsoft/Phi-3-mini': 'Phi-3 Mini',
      'llama3.1:8b': 'Llama 3.1 8B (Local)',
      'llama3:8b': 'Llama 3 8B (Local)',
      'mistral:7b': 'Mistral 7B (Local)',
      'gemma2:9b': 'Gemma 2 9B (Local)',
      'codellama:7b': 'CodeLlama 7B (Local)'
    }
    return displayNames[modelName] || modelName
  }

  // Reusable Header Component
  const Header = () => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
          BrainSwitch
        </h1>
        {/* Model Selector */}
        <select
          value={selectedModel || ''}
          onChange={(e) => setSelectedModel(e.target.value || null)}
          className="px-3 py-1 border rounded-lg bg-background text-sm"
        >
          <option value="">Auto (Smart Router)</option>
          {modelsData?.models
            .filter(model => model.is_available)
            .map((model) => (
              <option key={model.name} value={model.name}>
                {getModelDisplayName(model.name)} • {model.provider.toUpperCase()}
              </option>
            ))}
        </select>
      </div>

      {/* Temperature Control */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Temperature:</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-20"
        />
        <span className="w-8">{temperature}</span>
      </div>
    </div>
  )

  // Reusable File Attachment Display Component
  const FileAttachments = () => (
    attachedFiles.length > 0 && (
      <div className="mb-3 flex flex-wrap gap-2">
        {attachedFiles.map((file, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
          >
            {getFileIcon(file)}
            <span className="truncate max-w-32">{file.name}</span>
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    )
  )

  // Show welcome screen when no chat is active and showChat is false
  if (!showChat && messages.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <Header />

        {/* Welcome Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            {/* Welcome Message */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">What can I help with?</h2>
            </div>

            {/* Agent Cards */}
            <div className="mb-8">
              <AgentCards onAgentClick={handleAgentClick} />
            </div>

            {/* Welcome Screen Input */}
            <div className="max-w-2xl mx-auto">
              <SimpleMessageInput
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onSubmit={handleSubmit}
                onAttachClick={() => fileInputRef.current?.click()}
                isWelcomeScreen={true}
              />
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show chat interface when messages exist
  return (
    <div className="h-full flex flex-col">
      <Header />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-green-600 text-white'
                      }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                      }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content.split('\n').map((line, lineIndex) => {
                          // Check if line contains an image markdown
                          const imageMatch = line.match(/!\[.*?\]\((data:image\/[^)]+)\)/)
                          if (imageMatch) {
                            return (
                              <div key={lineIndex} className="my-2">
                                <img
                                  src={imageMatch[1]}
                                  alt="Generated image"
                                  className="max-w-full h-auto rounded-lg shadow-md"
                                  style={{ maxHeight: '400px' }}
                                />
                              </div>
                            )
                          }
                          return <div key={lineIndex}>{line}</div>
                        })}
                      </div>
                    </div>

                    {/* Message Metadata */}
                    {message.role === 'assistant' && (message.model || message.provider || message.latency) && (
                      <div className="mt-2 px-2">
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {message.model && <span>Model: {message.model}</span>}
                          {message.provider && <span>Provider: {message.provider}</span>}
                          {message.latency && <span>Latency: {message.latency.toFixed(0)}ms</span>}
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`mt-1 px-2 text-xs text-gray-500 dark:text-gray-400 ${message.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex justify-start"
            >
              <div className="flex gap-3 max-w-[75%]">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <FileAttachments />
            <SimpleMessageInput 
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSubmit={handleSubmit}
              onAttachClick={() => fileInputRef.current?.click()}
              isWelcomeScreen={false}
            />
            {/* Hidden File Input for ongoing chat sessions */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          {/* Footer Text */}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              BrainSwitch can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage


