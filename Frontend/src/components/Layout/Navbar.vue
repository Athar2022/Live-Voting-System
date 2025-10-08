<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and Brand -->
        <div class="flex items-center space-x-8">
          <RouterLink to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">VS</span>
            </div>
            <span class="text-xl font-bold text-gray-900">VotingSystem</span>
          </RouterLink>

          <!-- Navigation Links -->
          <div class="hidden md:flex space-x-6">
            <RouterLink 
              to="/" 
              class="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              :class="{ 'text-primary-600': $route.path === '/' }"
            >
              Home
            </RouterLink>
            <RouterLink 
              to="/polls" 
              class="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              :class="{ 'text-primary-600': $route.path.startsWith('/polls') && !$route.path.startsWith('/polls/create') }"
            >
              Browse Polls
            </RouterLink>
            <RouterLink 
              to="/polls/create" 
              class="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              :class="{ 'text-primary-600': $route.path === '/polls/create' }"
            >
              Create Poll
            </RouterLink>
          </div>
        </div>

        <!-- User Menu -->
        <div class="flex items-center space-x-4">
          <!-- Mobile menu button -->
          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                v-if="!isMobileMenuOpen"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M4 6h16M4 12h16M4 18h16" 
              />
              <path 
                v-else
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>

          <!-- Desktop User Menu -->
          <div class="hidden md:flex items-center space-x-4">
            <RouterLink 
              to="/my-polls" 
              class="text-gray-700 hover:text-primary-600 font-medium text-sm"
            >
              My Polls
            </RouterLink>
            <RouterLink 
              to="/my-votes" 
              class="text-gray-700 hover:text-primary-600 font-medium text-sm"
            >
              My Votes
            </RouterLink>
            
            <div class="relative" ref="userMenuRef">
              <button 
                @click="isUserMenuOpen = !isUserMenuOpen"
                class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div class="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium">
                  {{ userInitials }}
                </div>
                <span class="text-sm font-medium text-gray-700">
                  {{ authStore.user?.username }}
                </span>
                <svg 
                  class="w-4 h-4 text-gray-500 transition-transform"
                  :class="{ 'rotate-180': isUserMenuOpen }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- User Dropdown Menu -->
              <div 
                v-if="isUserMenuOpen"
                class="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <div class="px-4 py-2 border-b border-gray-100">
                  <p class="text-sm font-medium text-gray-900">{{ authStore.user?.username }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
                </div>
                <div class="py-1">
                  <button 
                    @click="handleLogout"
                    class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div 
        v-if="isMobileMenuOpen"
        class="md:hidden border-t border-gray-200 py-4 space-y-4"
      >
        <RouterLink 
          to="/" 
          class="block text-gray-700 hover:text-primary-600 font-medium py-2"
          @click="isMobileMenuOpen = false"
        >
          Home
        </RouterLink>
        <RouterLink 
          to="/polls" 
          class="block text-gray-700 hover:text-primary-600 font-medium py-2"
          @click="isMobileMenuOpen = false"
        >
          Browse Polls
        </RouterLink>
        <RouterLink 
          to="/polls/create" 
          class="block text-gray-700 hover:text-primary-600 font-medium py-2"
          @click="isMobileMenuOpen = false"
        >
          Create Poll
        </RouterLink>
        <RouterLink 
          to="/my-polls" 
          class="block text-gray-700 hover:text-primary-600 font-medium py-2"
          @click="isMobileMenuOpen = false"
        >
          My Polls
        </RouterLink>
        <RouterLink 
          to="/my-votes" 
          class="block text-gray-700 hover:text-primary-600 font-medium py-2"
          @click="isMobileMenuOpen = false"
        >
          My Votes
        </RouterLink>
        <div class="pt-4 border-t border-gray-200">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium">
              {{ userInitials }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ authStore.user?.username }}</p>
              <p class="text-xs text-gray-500">{{ authStore.user?.email }}</p>
            </div>
          </div>
          <button 
            @click="handleLogout"
            class="w-full flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium py-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Navbar',
  setup() {
    const router = useRouter()
    const toast = useToast()
    const authStore = useAuthStore()

    const isMobileMenuOpen = ref(false)
    const isUserMenuOpen = ref(false)
    const userMenuRef = ref(null)

    const userInitials = computed(() => {
      if (!authStore.user?.username) return 'U'
      return authStore.user.username
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    })

    const handleLogout = () => {
      authStore.logout()
      toast.success('You have been logged out successfully')
      router.push('/login')
      isMobileMenuOpen.value = false
      isUserMenuOpen.value = false
    }

    const handleClickOutside = (event) => {
      if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
        isUserMenuOpen.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      authStore,
      isMobileMenuOpen,
      isUserMenuOpen,
      userMenuRef,
      userInitials,
      handleLogout
    }
  }
}
</script>