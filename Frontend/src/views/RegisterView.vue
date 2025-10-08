<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="card shadow-xl">
        <div class="card-body p-8">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p class="text-gray-600">Join Voting System today</p>
          </div>

          <!-- Registration Form -->
          <form @submit.prevent="handleRegister" class="space-y-6">
            <div class="form-group">
              <label for="username" class="form-label">Username</label>
              <input
                id="username"
                v-model="form.username"
                type="text"
                class="form-input"
                placeholder="Choose a username"
                required
                minlength="3"
                maxlength="30"
              />
              <p class="text-xs text-gray-500 mt-1">3-30 characters, letters and numbers only</p>
            </div>

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
                placeholder="Create a password"
                required
                minlength="6"
              />
              <p class="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">Confirm Password</label>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                class="form-input"
                placeholder="Confirm your password"
                required
              />
              <p 
                v-if="form.password && form.confirmPassword && form.password !== form.confirmPassword"
                class="text-red-600 text-xs mt-1"
              >
                Passwords do not match
              </p>
            </div>

            <button 
              type="submit" 
              class="btn btn-primary w-full py-3"
              :disabled="loading || form.password !== form.confirmPassword"
            >
              <span 
                v-if="loading" 
                class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
              ></span>
              {{ loading ? 'Creating Account...' : 'Create Account' }}
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
              Already have an account? 
              <RouterLink 
                to="/login" 
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in here
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
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const toast = useToast()
    const authStore = useAuthStore()

    const form = ref({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    const loading = ref(false)
    const error = ref('')

    const handleRegister = async () => {
      try {
        if (form.value.password !== form.value.confirmPassword) {
          error.value = 'Passwords do not match'
          return
        }

        loading.value = true
        error.value = ''

        const result = await authStore.register({
          username: form.value.username,
          email: form.value.email,
          password: form.value.password
        })

        if (result.success) {
          toast.success('Account created successfully!')
          router.push('/')
        } else {
          error.value = result.error
          toast.error(result.error)
        }
      } catch (err) {
        error.value = 'An unexpected error occurred'
        toast.error('Registration failed')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      error,
      handleRegister
    }
  }
}
</script>