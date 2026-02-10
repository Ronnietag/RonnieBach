// API Service for Ronnie Portfolio
// Uses relative paths - works both dev and production
const API_BASE = '/api'

async function request(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }
  
  return response.json()
}

// Auth
export const auth = {
  async login(email: string, password: string) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  },
  
  async register(email: string, password: string, name: string) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    })
  }
}

// Blog
export const blog = {
  async getPosts(category?: string) {
    const query = category && category !== '全部' ? `?category=${category}` : ''
    return request(`/posts${query}`)
  },
  
  async getPost(id: string) {
    return request(`/posts/${id}`)
  },
  
  async createPost(title: string, content: string, category: string) {
    return request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, category })
    })
  },
  
  async deletePost(id: string) {
    return request(`/posts/${id}`, { method: 'DELETE' })
  }
}

// Stats
export const stats = {
  async get() {
    return request('/stats')
  }
}

// German Learning
export const german = {
  async getProgress(userId: string) {
    return request(`/german/progress/${userId}`)
  },
  
  async learnWord(userId: string, word: string, correct: boolean) {
    return request('/german/learn', {
      method: 'POST',
      body: JSON.stringify({ userId, word, correct })
    })
  }
}

// Game Scores
export const scores = {
  async get() {
    return request('/scores')
  },
  
  async submit(userId: string, userName: string, score: number, game: string) {
    return request('/scores', {
      method: 'POST',
      body: JSON.stringify({ userId, userName, score, game })
    })
  }
}
