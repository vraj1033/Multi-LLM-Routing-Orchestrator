import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Use Vite env for backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

interface User {
  id: number
  email: string
  name: string
  is_active: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const data = await res.json()
          if (!res.ok) throw new Error(data.detail || 'Login failed')

          // ✅ Save token and user immediately
          set({
            token: data.access_token,
            user: data.user || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          // ✅ Optional: re-validate with /auth/me
          await get().checkAuth()
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          })
          throw error
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.detail || 'Registration failed')
          set({ isLoading: false, error: null })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      checkAuth: async () => {
        const stored = localStorage.getItem('auth-storage')
        const parsed = stored ? JSON.parse(stored) : null
        const token = parsed?.state?.token || null // ✅ Fixed token lookup

        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.detail || 'Failed to fetch user')

          set({ user: data, isAuthenticated: true, error: null })
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          })
          if (
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')
          ) {
            window.location.href = '/login'
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)
