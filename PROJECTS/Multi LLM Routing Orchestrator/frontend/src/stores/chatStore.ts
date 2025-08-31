import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { llmApi } from '../services/api'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
  provider?: string
  latency?: number
}

export interface RecentSearch {
  id: number
  query: string
  created_at: string
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  titleGenerated?: boolean; // Track if title was auto-generated
}

export interface ChatState {
  messages: Message[];
  recentSearches: RecentSearch[];
  isLoading: boolean;
  selectedModel: string | null;
  chatSessions: Record<string, ChatSession[]>; // userId -> sessions
  activeSessionId: string | null;

  showChat: boolean;
  setShowChat: (show: boolean) => void;
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setRecentSearches: (searches: RecentSearch[]) => void;
  addRecentSearch: (search: RecentSearch) => void;
  removeRecentSearch: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setSelectedModel: (model: string | null) => void;
  saveCurrentChatSession: (userId: string | number | null, title?: string) => void;
  loadChatSession: (userId: string | number | null, sessionId: string) => void;
  newChatSession: (userId: string | number | null) => void;
  removeChatSession: (userId: string | number | null, sessionId: string) => void;
  generateTitleForSession: (userId: string | number | null, sessionId: string) => Promise<void>;
  clearActiveSession: () => void;
  createSessionFromMessages: (userId: string | number | null) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      recentSearches: [],
      isLoading: false,
      selectedModel: null,
      chatSessions: {},
      activeSessionId: null,
      showChat: false,
      setShowChat: (show: boolean) => set({ showChat: show }),

      addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
        const newMessage: Message = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date()
        };
        set((state: ChatState) => {
          const updatedMessages = [...state.messages, newMessage];

          // If a session is active, update its messages in chatSessions
          if (state.activeSessionId && state.chatSessions) {
            const userId = Object.keys(state.chatSessions).find(uid =>
              state.chatSessions[uid].some(s => s.id === state.activeSessionId)
            );
            if (userId) {
              const updatedSessions = state.chatSessions[userId].map(s =>
                s.id === state.activeSessionId ? { ...s, messages: updatedMessages } : s
              );

              // Auto-generate title after 2 messages (1 user + 1 assistant) if not already generated
              const currentSession = updatedSessions.find(s => s.id === state.activeSessionId);
              if (currentSession && updatedMessages.length >= 2 && !currentSession.titleGenerated &&
                currentSession.title.startsWith('New Chat -')) {
                // Trigger title generation asynchronously
                setTimeout(() => {
                  get().generateTitleForSession(userId, state.activeSessionId!);
                }, 1000);
              }

              return {
                messages: updatedMessages,
                chatSessions: {
                  ...state.chatSessions,
                  [userId]: updatedSessions
                }
              };
            }
          }
          return { messages: updatedMessages };
        });
      },

      clearMessages: () => {
        set({ messages: [] })
      },

      setRecentSearches: (searches: RecentSearch[]) => {
        set({ recentSearches: searches })
      },

      addRecentSearch: (search: RecentSearch) => {
        set((state: ChatState) => ({
          recentSearches: [search, ...state.recentSearches.slice(0, 19)] // Keep only last 20
        }))
      },

      removeRecentSearch: (id: number) => {
        set((state: ChatState) => ({
          recentSearches: state.recentSearches.filter((s: RecentSearch) => s.id !== id)
        }))
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setSelectedModel: (model: string | null) => {
        set({ selectedModel: model })
      },

      saveCurrentChatSession: (userId: string | number | null, title?: string) => {
        if (!userId) return;
        const state = get() as ChatState;
        // If renaming, update the title of the active session only
        if (title && state.activeSessionId) {
          set((prev: ChatState) => {
            const sessions = prev.chatSessions[userId] || [];
            const updatedSessions = sessions.map(s =>
              s.id === state.activeSessionId ? { ...s, title } : s
            );
            return {
              chatSessions: {
                ...prev.chatSessions,
                [userId]: updatedSessions
              }
            };
          });
          return;
        }
        // Only create a new session if there are messages and not just renaming
        if (state.messages.length === 0) return;
        const session: ChatSession = {
          id: Date.now().toString(),
          title: title || `Chat - ${new Date().toLocaleString()}`,
          messages: state.messages,
          created_at: new Date().toISOString(),
          titleGenerated: title ? true : false, // If title is provided, mark as generated
        };
        set((prev: ChatState) => ({
          chatSessions: {
            ...prev.chatSessions,
            [userId]: [session, ...(prev.chatSessions[userId] || [])].slice(0, 20)
          },
          activeSessionId: session.id
        }));
      },

      loadChatSession: (userId: string | number | null, sessionId: string) => {
        if (!userId) return;
        const state = get() as ChatState;
        const sessions = state.chatSessions[userId] || [];
        const session = sessions.find((s: ChatSession) => s.id === sessionId);
        if (session) {
          set({ messages: session.messages, activeSessionId: sessionId });
        }
      },

      newChatSession: (userId: string | number | null) => {
        if (!userId) return;
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: `New Chat - ${new Date().toLocaleString()}`,
          messages: [],
          created_at: new Date().toISOString(),
          titleGenerated: false,
        };
        set((prev: ChatState) => ({
          chatSessions: {
            ...prev.chatSessions,
            [userId]: [newSession, ...(prev.chatSessions[userId] || [])].slice(0, 20)
          },
          activeSessionId: newSession.id,
          messages: []
        }));
      },

      removeChatSession: (userId: string | number | null, sessionId: string) => {
        if (!userId) return;
        set((state: ChatState) => {
          const sessions = state.chatSessions[userId] || [];
          const updatedSessions = sessions.filter(s => s.id !== sessionId);
          let newActiveSessionId = state.activeSessionId;
          if (state.activeSessionId === sessionId) {
            newActiveSessionId = updatedSessions.length > 0 ? updatedSessions[0].id : null;
          }
          return {
            chatSessions: {
              ...state.chatSessions,
              [userId]: updatedSessions
            },
            activeSessionId: newActiveSessionId,
            messages: newActiveSessionId
              ? updatedSessions.find(s => s.id === newActiveSessionId)?.messages || []
              : []
          };
        });
      },

      generateTitleForSession: async (userId: string | number | null, sessionId: string) => {
        if (!userId) return;

        const state = get() as ChatState;
        const sessions = state.chatSessions[userId] || [];
        const session = sessions.find(s => s.id === sessionId);

        if (!session || session.titleGenerated || session.messages.length < 2) return;

        try {
          // Convert messages to the format expected by the API
          const apiMessages = session.messages.slice(0, 6).map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          const response = await llmApi.generateTitle(apiMessages);

          // Update the session with the generated title
          set((prevState: ChatState) => {
            const prevSessions = prevState.chatSessions[userId] || [];
            const updatedSessions = prevSessions.map(s =>
              s.id === sessionId
                ? { ...s, title: response.title, titleGenerated: true }
                : s
            );

            return {
              chatSessions: {
                ...prevState.chatSessions,
                [userId]: updatedSessions
              }
            };
          });
        } catch (error) {
          console.error('Failed to generate title:', error);
          // Mark as attempted to avoid retrying
          set((prevState: ChatState) => {
            const prevSessions = prevState.chatSessions[userId] || [];
            const updatedSessions = prevSessions.map(s =>
              s.id === sessionId
                ? { ...s, titleGenerated: true }
                : s
            );

            return {
              chatSessions: {
                ...prevState.chatSessions,
                [userId]: updatedSessions
              }
            };
          });
        }
      },

      clearActiveSession: () => {
        set({ activeSessionId: null });
      },

      createSessionFromMessages: (userId: string | number | null) => {
        if (!userId) return;

        const state = get() as ChatState;
        if (state.messages.length === 0 || state.activeSessionId) return;

        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: `New Chat - ${new Date().toLocaleString()}`,
          messages: state.messages,
          created_at: new Date().toISOString(),
          titleGenerated: false,
        };

        set((prevState: ChatState) => ({
          activeSessionId: newSession.id,
          chatSessions: {
            ...prevState.chatSessions,
            [userId]: [newSession, ...(prevState.chatSessions[userId] || [])].slice(0, 20)
          }
        }));
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state: ChatState) => ({
        messages: state.messages,
        recentSearches: state.recentSearches,
        selectedModel: state.selectedModel,
        chatSessions: state.chatSessions,
        activeSessionId: state.activeSessionId,
        showChat: state.showChat
      })
    }
  )
)







