import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const isConnected = ref(false)
  const connectionError = ref(null)

  const connect = () => {
    const authStore = useAuthStore()
    
    if (!authStore.token) {
      console.error('Cannot connect socket: No authentication token')
      return
    }

    if (socket.value) {
      disconnect()
    }

    try {
      socket.value = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: {
          token: authStore.token
        }
      })

      socket.value.on('connect', () => {
        isConnected.value = true
        connectionError.value = null
        console.log('Socket connected successfully')
      })

      socket.value.on('disconnect', (reason) => {
        isConnected.value = false
        console.log('Socket disconnected:', reason)
      })

      socket.value.on('connect_error', (error) => {
        isConnected.value = false
        connectionError.value = error.message
        console.error('Socket connection error:', error)
      })

    } catch (error) {
      console.error('Failed to initialize socket:', error)
      connectionError.value = error.message
    }
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  const joinPoll = (pollId) => {
    if (socket.value && isConnected.value) {
      socket.value.emit('joinPoll', pollId)
    }
  }

  const leavePoll = (pollId) => {
    if (socket.value && isConnected.value) {
      socket.value.emit('leavePoll', pollId)
    }
  }

  const on = (event, callback) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socket.value) {
      socket.value.off(event, callback)
    }
  }

  const emit = (event, data) => {
    if (socket.value && isConnected.value) {
      socket.value.emit(event, data)
    }
  }

  return {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    joinPoll,
    leavePoll,
    on,
    off,
    emit
  }
})