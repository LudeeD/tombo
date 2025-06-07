import config from '../config/env'

export interface Prompt {
  id: number
  title: string
  content: string
  description: string
  created_at: string
}

class ApiClient {
  private baseURL = config.apiBaseUrl
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.loadTokensFromStorage()
  }

  private loadTokensFromStorage() {
    const storedTokens = localStorage.getItem('auth_tokens')
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens)
        this.accessToken = tokens.accessToken
        this.refreshToken = tokens.refreshToken
      } catch (error) {
        localStorage.removeItem('auth_tokens')
      }
    }
  }

  private saveTokensToStorage() {
    if (this.accessToken && this.refreshToken) {
      localStorage.setItem('auth_tokens', JSON.stringify({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken
      }))
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.saveTokensToStorage()
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('auth_tokens')
    localStorage.removeItem('auth_user')
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(`${this.baseURL}/session/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        this.accessToken = data.jwt
        this.saveTokensToStorage()
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }

    this.clearTokens()
    return false
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    let response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken()
      if (refreshed && this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`
        response = await fetch(url, {
          ...options,
          headers,
        })
      }
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async getPrompts(): Promise<Prompt[]> {
    return this.get<Prompt[]>('/prompts')
  }

  async getTopPrompts(limit: number = 5): Promise<Prompt[]> {
    return this.get<Prompt[]>(`/prompts?limit=${limit}`)
  }

  async getPromptById(id: number): Promise<Prompt> {
    return this.get<Prompt>(`/prompts/${id}`)
  }
}

export const apiClient = new ApiClient()