import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUser = (userData) => {
    user.value = userData
  }

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      
      if (response.data.status === 'success') {
        setToken(response.data.token)
        setUser(response.data.data.user)
        
        return { success: true, data: response.data }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      
      if (response.data.status === 'success') {
        setToken(response.data.token)
        setUser(response.data.data.user)
        
        return { success: true, data: response.data }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me')
      
      if (response.data.status === 'success') {
        setUser(response.data.data.user)
        return { success: true, data: response.data }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
      }
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to get user data' 
      }
    }
  }

  const initializeAuth = async () => {
    if (token.value) {
      await getCurrentUser()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    getCurrentUser,
    initializeAuth
  }
})