/**
 * VoltLedger API Service Layer
 * Axios configuration and interceptors
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('voltledger_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('voltledger_refresh_token')
        if (!refreshToken) {
          // Clear auth and redirect to login
          localStorage.removeItem('voltledger_token')
          localStorage.removeItem('voltledger_refresh_token')
          localStorage.removeItem('voltledger_user')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        // Attempt to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data
        localStorage.setItem('voltledger_token', access_token)
        localStorage.setItem('voltledger_refresh_token', refresh_token)

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Clear auth and redirect to login
        localStorage.removeItem('voltledger_token')
        localStorage.removeItem('voltledger_refresh_token')
        localStorage.removeItem('voltledger_user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
