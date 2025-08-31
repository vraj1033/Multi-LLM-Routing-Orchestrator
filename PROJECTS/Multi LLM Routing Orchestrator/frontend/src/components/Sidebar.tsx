import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Plus,
  PenTool,
  Trash2,
  Menu,
  User,
  Moon,
  Sun,
  LogOut,
  Brain,
  Zap,
  Network
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { useChatStore } from '../stores/chatStore'
import Logo from './Logo'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { 
    chatSessions, 
    activeSessionId, 
    loadChatSession, 
    newChatSession, 
    saveCurrentChatSession, 
    removeChatSession, 
    setShowChat,
    clearMessages,
    generateTitleForSession,
    clearActiveSession
  } = useChatStore()
  
  const [collapsed, setCollapsed] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const handleNewChat = () => {
    if (user) {
      clearMessages()
      clearActiveSession()
      setShowChat(false) // Show welcome screen instead of chat
      // Navigate to main chat page
      navigate('/')
    }
  }

  const handleChatClick = (sessionId: string) => {
    if (user && activeSessionId !== sessionId) {
      loadChatSession(user.id, sessionId)
    }
    setShowChat(true)
    // Navigate to main chat page
    navigate('/')
  }

  const handleRename = (sessionId: string, currentTitle: string) => {
    setRenamingId(sessionId)
    setRenameValue(currentTitle)
  }

  const handleRenameSubmit = () => {
    if (user && renameValue.trim()) {
      saveCurrentChatSession(user.id, renameValue.trim())
    }
    setRenamingId(null)
  }

  const handleDelete = (sessionId: string) => {
    if (user) {
      removeChatSession(user.id, sessionId)
    }
  }

  return (
    <motion.aside
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 border-r border-gray-200 dark:border-gray-800 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
            <Logo size={collapsed ? "sm" : "md"} showText={false} />
          </div>
          
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Collapse button when collapsed - positioned at bottom right */}
        {collapsed && (
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors relative group`}
        >
          <Plus className="h-5 w-5" />
          {!collapsed && <span>New chat</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              New chat
            </div>
          )}
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-2">
          {user && chatSessions[user.id]?.map((session) => (
            <div
              key={session.id}
              className={`group relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? 'bg-gray-800 border-l-2 border-blue-400'
                  : 'hover:bg-gray-800'
              }`}
            >
              <MessageSquare 
                className={`h-4 w-4 flex-shrink-0 ${collapsed ? '' : ''}`}
                onClick={() => handleChatClick(session.id)}
              />
              
              {!collapsed && (
                <>
                  {renamingId === session.id ? (
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className="flex-1 bg-transparent border-b border-gray-600 outline-none text-sm"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => handleChatClick(session.id)}
                      className="flex-1 text-sm truncate"
                    >
                      {session.title}
                    </span>
                  )}

                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => handleRename(session.id, session.title)}
                      className="p-1 rounded hover:bg-gray-700"
                      title="Rename chat"
                    >
                      <PenTool className="h-3 w-3" />
                    </button>
                    {!session.titleGenerated && session.messages.length >= 2 && (
                      <button
                        onClick={() => user && generateTitleForSession(user.id, session.id)}
                        className="p-1 rounded hover:bg-gray-700 text-blue-400"
                        title="Generate smart title"
                      >
                        <Brain className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-1 rounded hover:bg-gray-700 text-red-400"
                      title="Delete chat"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}

              {/* Collapsed state tooltip */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {session.title}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-gray-700">
        <nav className="space-y-2">
          <Link
            to="/dashboard"
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg transition-colors relative group ${
              location.pathname === '/dashboard'
                ? 'bg-gray-800'
                : 'hover:bg-gray-800'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            {!collapsed && <span>Dashboard</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Dashboard
              </div>
            )}
          </Link>
          <Link
            to="/settings"
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg transition-colors relative group ${
              location.pathname === '/settings'
                ? 'bg-gray-800'
                : 'hover:bg-gray-800'
            }`}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span>Settings</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Settings
              </div>
            )}
          </Link>
        </nav>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="space-y-2">
          {/* Profile Info */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg hover:bg-gray-800 transition-colors relative group`}>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                <div>{user?.name}</div>
                <div className="text-gray-400">{user?.email}</div>
              </div>
            )}
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg hover:bg-gray-800 transition-colors relative group`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {!collapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </div>
            )}
          </button>
          
          {/* Logout */}
          <button
            onClick={logout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg hover:bg-gray-800 transition-colors text-red-400 relative group`}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Log out</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Log out
              </div>
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar
