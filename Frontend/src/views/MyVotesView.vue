<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">My Votes</h1>
      <p class="text-gray-600">View and manage your voting history</p>
    </div>

    <!-- Loading State -->
    <div 
      v-if="loading" 
      class="text-center py-12"
    >
      <div class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Loading your votes...</p>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="votes.length === 0" 
      class="card text-center py-12"
    >
      <div class="text-6xl mb-4">🗳️</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No votes yet</h3>
      <p class="text-gray-600 mb-6">Start voting on polls to see them here</p>
      <RouterLink 
        to="/polls" 
        class="btn btn-primary"
      >
        Browse Polls
      </RouterLink>
    </div>

    <!-- Votes List -->
    <div 
      v-else 
      class="space-y-6"
    >
      <div 
        v-for="vote in votes" 
        :key="vote._id" 
        class="card hover:shadow-lg transition-all duration-300"
      >
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                {{ vote.poll?.title }}
              </h3>
              <p class="text-gray-600 line-clamp-2">
                {{ vote.poll?.description || 'No description provided.' }}
              </p>
            </div>
            <span 
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                vote.poll?.isClosed 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              ]"
            >
              {{ vote.poll?.isClosed ? 'Closed' : 'Active' }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Your Vote -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-3">Your Vote</h4>
              <div class="space-y-2">
                <div 
                  v-for="optionIndex in vote.selectedOptions" 
                  :key="optionIndex"
                  class="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg border border-primary-200"
                >
                  <div class="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {{ String.fromCharCode(65 + optionIndex) }}
                  </div>
                  <span class="text-primary-900 font-medium">
                    {{ getOptionText(vote.poll, optionIndex) }}
                  </span>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Voted on {{ formatDate(vote.votedAt) }}
              </p>
            </div>

            <!-- Poll Status -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-3">Poll Status</h4>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Total Votes:</span>
                  <span class="font-medium">{{ vote.poll?.totalVotes }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Status:</span>
                  <span 
                    :class="[
                      'font-medium',
                      vote.poll?.isClosed ? 'text-red-600' : 'text-green-600'
                    ]"
                  >
                    {{ vote.poll?.isClosed ? 'Closed' : 'Active' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Created By:</span>
                  <span class="font-medium">{{ vote.poll?.createdBy?.username }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-200">
            <RouterLink 
              :to="`/polls/${vote.poll?._id}`" 
              class="btn btn-primary btn-sm"
            >
              View Poll
            </RouterLink>
            <RouterLink 
              :to="`/polls/${vote.poll?._id}/results`" 
              class="btn btn-outline btn-sm"
            >
              View Results
            </RouterLink>
            <button 
              v-if="!vote.poll?.isClosed"
              @click="withdrawVote(vote.poll?._id)"
              class="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
              :disabled="actionLoading"
            >
              Withdraw Vote
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div 
      v-if="pagination && pagination.pages > 1" 
      class="flex justify-center items-center space-x-2 mt-8"
    >
      <button 
        @click="changePage(pagination.current - 1)"
        :disabled="pagination.current === 1"
        class="btn btn-outline btn-sm"
      >
        Previous
      </button>
      
      <span class="text-sm text-gray-600">
        Page {{ pagination.current }} of {{ pagination.pages }}
      </span>
      
      <button 
        @click="changePage(pagination.current + 1)"
        :disabled="pagination.current === pagination.pages"
        class="btn btn-outline btn-sm"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import voteService from '@/services/voteService'

export default {
  name: 'MyVotesView',
  setup() {
    const toast = useToast()

    const votes = ref([])
    const loading = ref(true)
    const actionLoading = ref(false)
    const pagination = ref(null)

    const fetchMyVotes = async (page = 1) => {
      try {
        loading.value = true
        const response = await voteService.getUserVotes({ page, limit: 10 })
        votes.value = response.data.votes
        pagination.value = response.data.pagination
      } catch (error) {
        console.error('Error fetching votes:', error)
        toast.error('Failed to load your votes')
      } finally {
        loading.value = false
      }
    }

    const withdrawVote = async (pollId) => {
      if (!confirm('Are you sure you want to withdraw your vote? This action cannot be undone.')) {
        return
      }

      try {
        actionLoading.value = true
        await voteService.withdrawVote(pollId)
        toast.success('Vote withdrawn successfully')
        await fetchMyVotes(pagination.value.current)
      } catch (error) {
        console.error('Error withdrawing vote:', error)
        toast.error('Failed to withdraw vote')
      } finally {
        actionLoading.value = false
      }
    }

    const getOptionText = (poll, optionIndex) => {
      if (!poll || !poll.options || !poll.options[optionIndex]) {
        return 'Unknown Option'
      }
      return poll.options[optionIndex].text
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.pages) {
        fetchMyVotes(page)
      }
    }

    onMounted(() => {
      fetchMyVotes()
    })

    return {
      votes,
      loading,
      actionLoading,
      pagination,
      withdrawVote,
      getOptionText,
      formatDate,
      changePage
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
</style>