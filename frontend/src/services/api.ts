import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = '/api'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      // Token is invalid or expired, clear auth state
      const authStore = useAuthStore.getState()
      authStore.logout()
      
      // Redirect to login page
      window.location.href = '/login'
      
      throw new Error('Session expired. Please log in again.')
    }
    
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return apiRequest<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register: async (name: string, email: string, password: string) => {
    return apiRequest<{ id: number; email: string; name: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  },

  getCurrentUser: async () => {
    return apiRequest<{ id: number; email: string; name: string; is_active: boolean; created_at: string }>('/auth/me')
  },
}

// LLM API
export const llmApi = {
  generate: async (prompt: string, model?: string, maxTokens?: number, temperature?: number) => {
    return apiRequest<{
      response: string
      model: string
      provider: string
      latency_ms: number
      tokens_used?: number
    }>('/llm/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        model,
        max_tokens: maxTokens,
        temperature,
      }),
    })
  },

  generateImage: async (
    prompt: string, 
    model?: string, 
    width?: number, 
    height?: number,
    numImages?: number,
    guidanceScale?: number,
    numInferenceSteps?: number
  ) => {
    return apiRequest<{
      images: string[]
      model: string
      provider: string
      latency_ms: number
      prompt: string
    }>('/llm/generate-image', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        model,
        width,
        height,
        num_images: numImages,
        guidance_scale: guidanceScale,
        num_inference_steps: numInferenceSteps,
      }),
    })
  },

  getModels: async () => {
    return apiRequest<{
      models: Array<{
        name: string
        provider: string
        max_tokens: number
        is_local: boolean
        is_available: boolean
        model_type?: string
      }>
      auto_routing_enabled: boolean
    }>('/llm/models')
  },

  getImageModels: async () => {
    return apiRequest<{
      models: Array<{
        name: string
        display_name: string
        description: string
        provider: string
        model_type: string
        is_available: boolean
      }>
      service_available: boolean
    }>('/llm/image-models')
  },

  generateTitle: async (messages: Array<{ role: string; content: string }>) => {
    return apiRequest<{
      title: string
      model: string
      provider: string
      latency_ms: number
    }>('/llm/generate-title', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })
  },

  healthCheck: async () => {
    return apiRequest<{ status: string; providers: Record<string, any> }>('/llm/health')
  },

  summarizeImage: async (file: File) => {
    const form = new FormData()
    form.append('file', file)

    const url = `${API_BASE_URL}/llm/summarize-image`
    const token = useAuthStore.getState().token
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: form
    })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(err || 'Failed to summarize image')
    }
    return response.json() as Promise<{ summary: string; model: string; provider: string }>
  }
}

// Searches API
export const searchesApi = {
  getRecent: async (limit = 20) => {
    return apiRequest<{
      searches: Array<{ id: number; query: string; created_at: string }>
      total: number
    }>(`/searches/recent?limit=${limit}`)
  },

  create: async (query: string) => {
    return apiRequest<{ id: number; query: string; created_at: string }>('/searches', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  },

  delete: async (id: number) => {
    return apiRequest<{ message: string }>(`/searches/${id}`, {
      method: 'DELETE',
    })
  },
}

// Metrics API
export const metricsApi = {
  getSummary: async () => {
    return apiRequest<{
      total_requests: number
      successful_requests: number
      failed_requests: number
      avg_latency_ms: number
      total_tokens: number
      requests_by_model: Record<string, number>
      requests_by_provider: Record<string, number>
    }>('/metrics/summary')
  },

  getSeries: async (days = 30) => {
    return apiRequest<{
      requests_over_time: Array<{
        timestamp: string
        requests: number
        avg_latency: number
      }>
      latency_by_model: Record<string, Array<{
        timestamp: string
        requests: number
        avg_latency: number
      }>>
    }>(`/metrics/series?days=${days}`)
  },
}




