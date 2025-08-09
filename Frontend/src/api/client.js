import axios from 'axios'
import { getAccessToken, logout } from '../auth/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response interceptor for 401 -> auto-logout
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      logout()
    }
    return Promise.reject(error)
  }
)

export default api