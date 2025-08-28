import { FC } from 'react'
import { MessageSquare, Code, PenTool, Image, Lightbulb, BookOpen, Calculator, Globe } from 'lucide-react'

interface AgentCardProps {
  title: string
  description: string
  icon: JSX.Element
  onClick?: (title: string) => void
  gradient: string
}

const AgentCard: FC<AgentCardProps> = ({ title, description, icon, onClick, gradient }) => (
  <button
    className={`flex flex-col items-start gap-3 p-4 rounded-2xl border border-gray-200/50 hover:border-gray-300/50 dark:border-gray-700/50 dark:hover:border-gray-600/50 transition-all duration-300 text-left w-full hover:shadow-lg dark:hover:shadow-xl group relative overflow-hidden ${gradient}`}
    onClick={() => onClick?.(title)}
  >
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 transition-opacity duration-300 group-hover:bg-white/60 dark:group-hover:bg-gray-900/60"></div>
    <div className="relative z-10 text-gray-700 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
      {icon}
    </div>
    <div className="relative z-10">
      <div className="font-medium text-gray-900 dark:text-white mb-1 text-sm">{title}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
    </div>
  </button>
)

type AgentCardsProps = {
  onAgentClick?: (agentName: string) => void
}

const AgentCards: FC<AgentCardsProps> = ({ onAgentClick }) => {
  const agents = [
    {
      title: 'Create a plan',
      description: 'for a relaxing day',
      icon: <Lightbulb className="h-5 w-5" />,
      gradient: 'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 dark:from-yellow-500 dark:via-orange-500 dark:to-red-500'
    },
    {
      title: 'Help me write',
      description: 'a professional email',
      icon: <PenTool className="h-5 w-5" />,
      gradient: 'bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-600'
    },
    {
      title: 'Code review',
      description: 'and optimization tips',
      icon: <Code className="h-5 w-5" />,
      gradient: 'bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 dark:from-green-500 dark:via-emerald-500 dark:to-teal-600'
    },
    {
      title: 'Explain concepts',
      description: 'in simple terms',
      icon: <BookOpen className="h-5 w-5" />,
      gradient: 'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400 dark:from-pink-500 dark:via-rose-500 dark:to-red-500'
    },
    {
      title: 'Brainstorm ideas',
      description: 'for a creative project',
      icon: <MessageSquare className="h-5 w-5" />,
      gradient: 'bg-gradient-to-br from-purple-400 via-violet-400 to-purple-600 dark:from-purple-500 dark:via-violet-500 dark:to-purple-700'
    },
    {
      title: 'Solve math problems',
      description: 'step by step',
      icon: <Calculator className="h-5 w-5" />,
      gradient: 'bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500 dark:from-cyan-500 dark:via-blue-500 dark:to-indigo-600'
    },
    {
      title: 'Research topics',
      description: 'and summarize findings',
      icon: <Globe className="h-5 w-5" />,
      gradient: 'bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 dark:from-emerald-500 dark:via-teal-500 dark:to-cyan-600'
    },
    {
      title: 'Generate images',
      description: 'from text descriptions',
      icon: <Image className="h-5 w-5" />,
      gradient: 'bg-gradient-to-br from-orange-400 via-pink-400 to-red-500 dark:from-orange-500 dark:via-pink-500 dark:to-red-600'
    }
  ]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {agents.map((agent, idx) => (
          <AgentCard key={idx} {...agent} onClick={onAgentClick} />
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        click any one of them to get started
      </p>
    </div>
  )
}

export default AgentCards
