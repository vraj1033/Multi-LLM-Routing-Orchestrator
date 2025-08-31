import { FC } from 'react'
import { Brain, Zap } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const Logo: FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: {
      container: 'h-8',
      icon: 'h-6 w-6',
      text: 'text-lg',
      iconContainer: 'w-8 h-8'
    },
    md: {
      container: 'h-10',
      icon: 'h-7 w-7',
      text: 'text-xl',
      iconContainer: 'w-10 h-10'
    },
    lg: {
      container: 'h-12',
      icon: 'h-8 w-8',
      text: 'text-2xl',
      iconContainer: 'w-12 h-12'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`flex items-center gap-3 ${currentSize.container}`}>
      {/* Logo Icon */}
      <div className={`relative ${currentSize.iconContainer} rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group`}>
        {/* Background glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-500 opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>
        
        {/* Main icon */}
        <div className="relative z-10 flex items-center justify-center">
          <Brain className={`${currentSize.icon} text-white drop-shadow-sm`} />
          {/* Lightning bolt overlay */}
          <Zap className="absolute h-3 w-3 text-yellow-300 top-0 right-0 transform translate-x-1 -translate-y-1 drop-shadow-sm" />
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${currentSize.text} font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight`}>
            BrainSwitch
          </h1>
          <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1 font-medium">
            AI Assistant
          </span>
        </div>
      )}
    </div>
  )
}

export default Logo