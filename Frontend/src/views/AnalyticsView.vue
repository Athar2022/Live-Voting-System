<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Poll Analytics</h1>
          <p class="text-gray-600">Deep insights and statistics for your poll</p>
        </div>
        <div class="flex space-x-3">
          <button
            @click="showExportModal = true"
            class="btn btn-outline"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Data
          </button>
          <RouterLink
            :to="`/polls/${pollId}`"
            class="btn btn-primary"
          >
            Back to Poll
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Loading analytics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card text-center py-12">
      <div class="text-6xl mb-4">📊</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Analytics Unavailable</h3>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <RouterLink :to="`/polls/${pollId}`" class="btn btn-primary">
        Back to Poll
      </RouterLink>
    </div>

    <!-- Analytics Content -->
    <div v-else-if="analytics" class="space-y-8">
      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card p-6 text-center">
          <div class="text-3xl font-bold text-primary-600 mb-2">
            {{ analytics.poll.totalVotes }}
          </div>
          <div class="text-gray-600">Total Votes</div>
        </div>
        <div class="card p-6 text-center">
          <div class="text-3xl font-bold text-green-600 mb-2">
            {{ analytics.optionStats.length }}
          </div>
          <div class="text-gray-600">Options</div>
        </div>
        <div class="card p-6 text-center">
          <div class="text-3xl font-bold text-blue-600 mb-2">
            {{ Math.round(analytics.summary.averageOptionsPerVote) }}
          </div>
          <div class="text-gray-600">Avg Options/Vote</div>
        </div>
        <div class="card p-6 text-center">
          <div class="text-3xl font-bold text-purple-600 mb-2">
            {{ analytics.summary.voteRatePerHour }}
          </div>
          <div class="text-gray-600">Votes/Hour</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Bar Chart -->
        <div class="card">
          <div class="card-body p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Vote Distribution</h3>
            <AdvancedBarChart 
              :data="analytics"
              :user-vote="userVote"
            />
          </div>
        </div>

        <!-- Pie Chart -->
        <div class="card">
          <div class="card-body p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Results Breakdown</h3>
            <PieChart 
              :data="analytics"
              :user-vote="userVote"
            />
          </div>
        </div>
      </div>

      <!-- Time Series Chart -->
      <div class="card" v-if="analytics.votesOverTime?.length">
        <div class="card-body p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Votes Over Time</h3>
          <VotesOverTimeChart :analytics="analytics" />
        </div>
      </div>

      <!-- Detailed Statistics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Option Performance -->
        <div class="card lg:col-span-2">
          <div class="card-body p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Option Performance</h3>
            <div class="space-y-4">
              <div
                v-for="(option, index) in analytics.optionStats"
                :key="index"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div class="flex items-center space-x-4 flex-1">
                  <div class="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {{ String.fromCharCode(65 + index) }}
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ option.text }}</p>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        class="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                        :style="{ width: `${option.percentage}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold text-primary-600">{{ option.percentage }}%</p>
                  <p class="text-sm text-gray-600">{{ option.votes }} votes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="card">
          <div class="card-body p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Summary</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <span class="text-gray-600">Most Popular</span>
                <span class="font-medium text-gray-900">
                  {{ analytics.summary.mostPopularOption.text }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <span class="text-gray-600">Winning Margin</span>
                <span class="font-medium text-green-600">
                  {{ analytics.summary.mostPopularOption.percentage }}%
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <span class="text-gray-600">Avg Options/Vote</span>
                <span class="font-medium text-gray-900">
                  {{ analytics.summary.averageOptionsPerVote }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <span class="text-gray-600">Vote Rate</span>
                <span class="font-medium text-gray-900">
                  {{ analytics.summary.voteRatePerHour }}/hour
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-600">Poll Duration</span>
                <span class="font-medium text-gray-900">
                  {{ getPollDuration() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time Indicator -->
      <div v-if="!analytics.poll.isClosed && socketStore.isConnected" class="flex items-center justify-center space-x-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live analytics - data updates in real-time</span>
      </div>
    </div>

    <!-- Export Modal -->
    <ExportModal
      v-if="showExportModal"
      :poll="analytics?.poll"
      :analytics="analytics"
      @close="showExportModal = false"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useSocketStore } from '@/stores/socket'
import { useAuthStore } from '@/stores/auth'
import AdvancedBarChart from '@/components/Charts/AdvancedBarChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'
import VotesOverTimeChart from '@/components/Charts/VotesOverTimeChart.vue'
import ExportModal from '@/components/Export/ExportModal.vue'
import voteService from '@/services/voteService'

export default {
  name: 'AnalyticsView',
  components: {
    AdvancedBarChart,
    PieChart,
    VotesOverTimeChart,
    ExportModal
  },
  setup() {
    const route = useRoute()
    const toast = useToast()
    const socketStore = useSocketStore()
    const authStore = useAuthStore()

    const analytics = ref(null)
    const loading = ref(true)
    const error = ref('')
    const showExportModal = ref(false)
    const pollId = ref(route.params.id)

    const userVote = computed(() => {
      return analytics.value?.userVote
    })

    const fetchAnalytics = async () => {
      try {
        loading.value = true
        error.value = ''

        const response = await voteService.getVoteAnalytics(pollId.value)
        analytics.value = response.data.analytics

        // Join socket room for real-time updates
        if (socketStore.isConnected) {
          socketStore.joinPoll(pollId.value)
        }

      } catch (err) {
        console.error('Error fetching analytics:', err)
        error.value = err.response?.data?.message || 'Failed to load analytics'
        toast.error('Failed to load analytics')
      } finally {
        loading.value = false
      }
    }

    const getPollDuration = () => {
      if (!analytics.value) return ''
      
      const created = new Date(analytics.value.poll.createdAt)
      const now = analytics.value.poll.isClosed 
        ? new Date(analytics.value.poll.closesAt || analytics.value.poll.updatedAt)
        : new Date()
      
      const diffTime = Math.abs(now - created)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
    }

    // Socket event handlers
    const handleVoteUpdate = (data) => {
      if (data.pollId === pollId.value && analytics.value) {
        // Refresh analytics data
        fetchAnalytics()
        toast.info('Analytics updated with new vote')
      }
    }

    onMounted(() => {
      fetchAnalytics()

      // Set up socket listeners
      socketStore.on('voteUpdate', handleVoteUpdate)
    })

    onUnmounted(() => {
      // Leave socket room and remove listeners
      if (socketStore.isConnected) {
        socketStore.leavePoll(pollId.value)
      }
      socketStore.off('voteUpdate', handleVoteUpdate)
    })

    return {
      analytics,
      loading,
      error,
      showExportModal,
      pollId,
      userVote,
      socketStore,
      getPollDuration
    }
  }
}
</script>