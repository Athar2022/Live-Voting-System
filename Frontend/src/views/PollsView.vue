<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Browse Polls</h1>
      <p class="text-gray-600">Discover and participate in community polls</p>
    </div>

    <!-- Filters and Search -->
    <div class="card p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="md:col-span-2">
          <label for="search" class="form-label">Search Polls</label>
          <div class="relative">
            <input
              id="search"
              v-model="filters.search"
              type="text"
              class="form-input pl-10"
              placeholder="Search by title or description..."
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label for="status" class="form-label">Status</label>
          <select id="status" v-model="filters.status" class="form-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label for="sort" class="form-label">Sort By</label>
          <select id="sort" v-model="filters.sort" class="form-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostVotes">Most Votes</option>
            <option value="leastVotes">Least Votes</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Loading polls...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="polls.length === 0" class="card text-center py-12">
      <div class="text-6xl mb-4">📊</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No polls found</h3>
      <p class="text-gray-600 mb-6">Try adjusting your search criteria or create a new poll</p>
      <RouterLink to="/polls/create" class="btn btn-primary">
        Create New Poll
      </RouterLink>
    </div>

    <!-- Polls Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
              <span 
                v-if="!poll.isPublic"
                class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                Private
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
              <div class="text-2xl font-bold text-gray-900">
                {{ Math.round(poll.totalVotes > 0 ? (poll.totalVotes / 100) * 100 : 0) }}%
              </div>
              <div class="text-xs text-gray-500">Engagement</div>
            </div>
          </div>

          <!-- Poll Meta -->
          <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
            <div class="flex items-center space-x-2">
              <div class="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                {{ getInitials(poll.createdBy?.username) }}
              </div>
              <span>By {{ poll.createdBy?.username }}</span>
            </div>
            <span>{{ formatDate(poll.createdAt) }}</span>
          </div>

          <!-- Poll Actions -->
          <div class="flex gap-2">
            <RouterLink 
              :to="`/polls/${poll._id}`" 
              class="btn btn-primary btn-sm flex-1 text-center"
            >
              {{ poll.isClosed ? 'View' : 'Vote' }}
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

    <!-- Pagination -->
    <div v-if="pagination && pagination.pages > 1" class="flex justify-center items-center space-x-4">
      <button 
        @click="changePage(pagination.current - 1)"
        :disabled="pagination.current === 1"
        class="btn btn-outline btn-sm"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">
          Page {{ pagination.current }} of {{ pagination.pages }}
        </span>
        <span class="text-sm text-gray-500">•</span>
        <span class="text-sm text-gray-600">
          {{ pagination.total }} total polls
        </span>
      </div>
      
      <button 
        @click="changePage(pagination.current + 1)"
        :disabled="pagination.current === pagination.pages"
        class="btn btn-outline btn-sm"
      >
        Next
        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash'
import pollService from '@/services/pollService'

export default {
  name: 'PollsView',
  setup() {
    const toast = useToast()

    const polls = ref([])
    const loading = ref(true)
    const filters = ref({
      search: '',
      status: '',
      sort: 'newest'
    })
    const pagination = ref(null)

    const fetchPolls = async (page = 1) => {
      try {
        loading.value = true
        const params = { 
          page, 
          limit: 9,
          ...filters.value
        }

        // Clean up empty filters
        Object.keys(params).forEach(key => {
          if (params[key] === '') {
            delete params[key]
          }
        })

        const response = await pollService.getPolls(params)
        polls.value = response.data.polls
        pagination.value = response.data.pagination
      } catch (error) {
        console.error('Error fetching polls:', error)
        toast.error('Failed to load polls')
      } finally {
        loading.value = false
      }
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.pages) {
        fetchPolls(page)
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }

    const getInitials = (username) => {
      if (!username) return 'U'
      return username
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    // Debounced search to avoid too many API calls
    const debouncedFetch = debounce(() => {
      fetchPolls(1)
    }, 500)

    onMounted(() => {
      fetchPolls()
    })

    watch(filters, () => {
      debouncedFetch()
    }, { deep: true })

    return {
      polls,
      loading,
      filters,
      pagination,
      changePage,
      formatDate,
      getInitials
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