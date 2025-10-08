<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">My Polls</h1>
      <p class="text-gray-600">Manage and track your created polls</p>
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center mb-6">
      <RouterLink 
        to="/polls/create" 
        class="btn btn-primary"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create New Poll
      </RouterLink>

      <div class="flex items-center space-x-4">
        <select 
          v-model="filters.status" 
          class="form-select w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div 
      v-if="loading" 
      class="text-center py-12"
    >
      <div class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Loading your polls...</p>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="polls.length === 0" 
      class="card text-center py-12"
    >
      <div class="text-6xl mb-4">📊</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No polls yet</h3>
      <p class="text-gray-600 mb-6">Create your first poll to get started</p>
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
      class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <div 
        v-for="poll in polls" 
        :key="poll._id" 
        class="card hover:shadow-lg transition-all duration-300"
      >
        <div class="p-6">
          <!-- Poll Header -->
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-semibold text-gray-900 flex-1 mr-3 line-clamp-2">
              {{ poll.title }}
            </h3>
            <div class="flex items-center space-x-2">
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
          </div>
          
          <!-- Poll Description -->
          <p class="text-gray-600 mb-4 line-clamp-3">
            {{ poll.description || 'No description provided.' }}
          </p>
          
          <!-- Poll Stats -->
          <div class="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <div class="text-2xl font-bold text-gray-900">{{ poll.totalVotes }}</div>
              <div class="text-xs text-gray-500">Votes</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">{{ poll.options.length }}</div>
              <div class="text-xs text-gray-500">Options</div>
            </div>
            <div>
              <div 
                :class="[
                  'text-2xl font-bold',
                  poll.isPublic ? 'text-green-600' : 'text-blue-600'
                ]"
              >
                {{ poll.isPublic ? 'Public' : 'Private' }}
              </div>
              <div class="text-xs text-gray-500">Visibility</div>
            </div>
          </div>

          <!-- Poll Meta -->
          <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span>Created {{ formatDate(poll.createdAt) }}</span>
            <span v-if="poll.closesAt">
              Closes {{ formatDate(poll.closesAt) }}
            </span>
          </div>

          <!-- Poll Actions -->
          <div class="flex flex-wrap gap-2">
            <RouterLink 
              :to="`/polls/${poll._id}`" 
              class="btn btn-primary btn-sm flex-1 text-center"
            >
              View
            </RouterLink>
            <RouterLink 
              :to="`/polls/${poll._id}/results`" 
              class="btn btn-outline btn-sm flex-1 text-center"
            >
              Results
            </RouterLink>
            <button 
              v-if="!poll.isClosed"
              @click="closePoll(poll._id)"
              class="btn btn-outline btn-sm text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              :disabled="actionLoading"
            >
              Close
            </button>
            <button 
              @click="deletePoll(poll._id)"
              class="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
              :disabled="actionLoading"
            >
              Delete
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
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import pollService from '@/services/pollService'

export default {
  name: 'MyPollsView',
  setup() {
    const toast = useToast()

    const polls = ref([])
    const loading = ref(true)
    const actionLoading = ref(false)
    const filters = ref({
      status: ''
    })
    const pagination = ref(null)

    const fetchMyPolls = async (page = 1) => {
      try {
        loading.value = true
        const params = { page, limit: 9 }
        
        if (filters.value.status) {
          params.status = filters.value.status
        }

        const response = await pollService.getMyPolls(params)
        polls.value = response.data.polls
        pagination.value = response.data.pagination
      } catch (error) {
        console.error('Error fetching polls:', error)
        toast.error('Failed to load your polls')
      } finally {
        loading.value = false
      }
    }

    const closePoll = async (pollId) => {
      try {
        actionLoading.value = true
        await pollService.closePoll(pollId)
        toast.success('Poll closed successfully')
        await fetchMyPolls(pagination.value.current)
      } catch (error) {
        console.error('Error closing poll:', error)
        toast.error('Failed to close poll')
      } finally {
        actionLoading.value = false
      }
    }

    const deletePoll = async (pollId) => {
      if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
        return
      }

      try {
        actionLoading.value = true
        await pollService.deletePoll(pollId)
        toast.success('Poll deleted successfully')
        await fetchMyPolls(pagination.value.current)
      } catch (error) {
        console.error('Error deleting poll:', error)
        toast.error('Failed to delete poll')
      } finally {
        actionLoading.value = false
      }
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.pages) {
        fetchMyPolls(page)
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    onMounted(() => {
      fetchMyPolls()
    })

    watch(filters, () => {
      fetchMyPolls(1)
    }, { deep: true })

    return {
      polls,
      loading,
      actionLoading,
      filters,
      pagination,
      closePoll,
      deletePoll,
      changePage,
      formatDate
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