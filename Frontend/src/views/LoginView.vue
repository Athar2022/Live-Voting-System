<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="card shadow-xl">
        <div class="card-body p-8">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p class="text-gray-600">Welcome back to Voting System</p>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-6">
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                class="form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              class="btn btn-primary w-full py-3"
              :disabled="loading"
            >
              <span 
                v-if="loading" 
                class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
              ></span>
              {{ loading ? 'Signing In...' : 'Sign In' }}
            </button>

            <!-- Error Message -->
            <div 
              v-if="error" 
              class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
            >
              {{ error }}
            </div>
          </form>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-gray-200 text-center">
            <p class="text-gray-600">
              Don't have an account? 
              <RouterLink 
                to="/register" 
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up here
              </RouterLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const toast = useToast()
    const authStore = useAuthStore()

    const form = ref({
      email: '',
      password: ''
    })
    const loading = ref(false)
    const error = ref('')

    const handleLogin = async () => {
      try {
        loading.value = true
        error.value = ''

        const result = await authStore.login(form.value)

        if (result.success) {
          toast.success('Welcome back!')
          router.push('/')
        } else {
          error.value = result.error
          toast.error(result.error)
        }
      } catch (err) {
        error.value = 'An unexpected error occurred'
        toast.error('Login failed')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      error,
      handleLogin
    }
  }
}
</script>