<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Hero Section -->
      <div class="text-center bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl text-white py-16 px-4 mb-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">Welcome to Voting System</h1>
        <p class="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Create, participate, and track real-time polls with live results and analytics.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink 
            to="/polls/create" 
            class="btn btn-primary text-lg px-8 py-3"
          >
            Create Poll
          </RouterLink>
          <RouterLink 
            to="/polls" 
            class="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
          >
            Browse Polls
          </RouterLink>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="mb-12">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            v-for="stat in statCards" 
            :key="stat.label"
            class="card text-center p-6"
          >
            <div class="text-3xl mb-2">{{ stat.emoji }}</div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ stats[stat.key] || 0 }}
            </div>
            <div class="text-gray-600 text-sm">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Polls Section -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold text-gray-900">Recent Polls</h2>
          <RouterLink 
            to="/polls" 
            class="btn btn-outline btn-sm"
          >
            View All
          </RouterLink>
        </div>
        
        <!-- Loading State -->
        <div 
          v-if="loading" 
          class="text-center py-12"
        >
          <div class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600">Loading polls...</p>
        </div>

        <!-- Empty State -->
        <div 
          v-else-if="recentPolls.length === 0" 
          class="card text-center py-12"
        >
          <p class="text-gray-600 mb-4">No polls available yet.</p>
          <RouterLink 
            to="/polls/create" 
            class="btn btn-primary"
          >
            Create First Poll
          </RouterLink>
        </div>

        <!-- Polls Grid -->
        <div 
          v-else 
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div 
            v-for="poll in recentPolls" 
            :key="poll._id" 
            class="card hover:shadow-lg transition-shadow duration-300"
          >
            <div class="p-6">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold text-gray-900 flex-1 mr-3 line-clamp-2">
                  {{ poll.title }}
                </h3>
                <span 
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium',
                    poll.isClosed 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  ]"
                >
                  {{ poll.isClosed ? 'Closed' : 'Active' }}
                </span>
              </div>
              
              <p class="text-gray-600 mb-4 line-clamp-3">
                {{ poll.description || 'No description provided.' }}
              </p>
              
              <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>By {{ poll.createdBy?.username }}</span>
                <span>{{ poll.totalVotes }} votes</span>
              </div>

              <div class="flex gap-2">
                <RouterLink 
                  :to="`/polls/${poll._id}`" 
                  class="btn btn-primary btn-sm flex-1 text-center"
                >
                  View Poll
                </RouterLink>
                <RouterLink 
                  :to="`/polls/${poll._id}/results`" 
                  class="btn btn-outline btn-sm flex-1 text-center"
                >
                  Results
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

export default {
  name: 'HomeView',
  setup() {
    const stats = ref({})
    const recentPolls = ref([])
    const loading = ref(true)

    const statCards = [
      { emoji: '📊', label: 'Total Polls', key: 'totalPolls' },
      { emoji: '🗳️', label: 'Total Votes', key: 'totalVotes' },
      { emoji: '👥', label: 'Active Users', key: 'totalUsers' },
      { emoji: '⚡', label: 'Active Polls', key: 'activePolls' }
    ]

    const fetchHomeData = async () => {
      try {
        loading.value = true
        
        const statsResponse = await api.get('/stats/system')
        stats.value = statsResponse.data.data.stats

        const pollsResponse = await api.get('/polls', {
          params: { limit: 6, page: 1 }
        })
        recentPolls.value = pollsResponse.data.data.polls

      } catch (error) {
        console.error('Error fetching home data:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchHomeData()
    })

    return {
      stats,
      recentPolls,
      loading,
      statCards
    }
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>