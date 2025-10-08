<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Loading poll...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card text-center py-12">
      <div class="text-6xl mb-4">❌</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Poll Not Found</h3>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <RouterLink to="/polls" class="btn btn-primary">
        Browse Polls
      </RouterLink>
    </div>

    <!-- Poll Content -->
    <div v-else-if="poll" class="space-y-6">
      <!-- Poll Header -->
      <div class="card">
        <div class="card-body p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ poll.title }}</h1>
              <p class="text-gray-600 text-lg">{{ poll.description }}</p>
            </div>
            <div class="flex flex-col items-end space-y-2">
              <span 
                :class="[
                  'px-4 py-2 rounded-full text-sm font-medium',
                  poll.isClosed 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                ]"
              >
                {{ poll.isClosed ? 'Closed' : 'Active' }}
              </span>
              <span 
                v-if="!poll.isPublic"
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                Private Poll
              </span>
            </div>
          </div>

          <!-- Poll Meta -->
          <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
            <div class="flex items-center space-x-4 text-sm text-gray-600">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {{ getInitials(poll.createdBy?.username) }}
                </div>
                <span>Created by <strong>{{ poll.createdBy?.username }}</strong></span>
              </div>
              <span>•</span>
              <span>Created {{ formatDate(poll.createdAt) }}</span>
              <span v-if="poll.closesAt">•</span>
              <span v-if="poll.closesAt" :class="poll.isClosed ? 'text-red-600' : 'text-green-600'">
                {{ poll.isClosed ? 'Closed' : 'Closes' }} {{ formatDate(poll.closesAt) }}
              </span>
            </div>

            <div class="flex items-center space-x-4 text-sm text-gray-600">
              <span>{{ poll.totalVotes }} votes</span>
              <span>•</span>
              <span>{{ poll.options.length }} options</span>
              <span v-if="poll.allowMultiple" class="bg-primary-100 text-primary-600 px-2 py-1 rounded text-xs">
                Multiple choices allowed
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Voting Section -->
      <div v-if="!poll.isClosed" class="card">
        <div class="card-body p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Cast Your Vote</h2>
            <div v-if="hasVoted" class="flex items-center space-x-2 text-green-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium">You've already voted</span>
            </div>
          </div>

          <!-- Voting Form -->
          <form v-if="!hasVoted" @submit.prevent="handleVote" class="space-y-4">
            <div 
              v-for="(option, index) in poll.options" 
              :key="index"
              class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
              @click="toggleOption(index)"
            >
              <input
                :id="`option-${index}`"
                v-model="selectedOptions"
                :value="index"
                :type="poll.allowMultiple ? 'checkbox' : 'radio'"
                class="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <label 
                :for="`option-${index}`" 
                class="flex-1 cursor-pointer"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {{ String.fromCharCode(65 + index) }}
                  </div>
                  <span class="text-lg font-medium text-gray-900">{{ option.text }}</span>
                </div>
              </label>
            </div>

            <!-- Vote Button -->
            <button
              type="submit"
              class="btn btn-primary w-full py-3 text-lg"
              :disabled="selectedOptions.length === 0 || voting"
            >
              <span 
                v-if="voting" 
                class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
              ></span>
              {{ voting ? 'Submitting Vote...' : 'Submit Vote' }}
            </button>

            <p v-if="poll.allowMultiple" class="text-sm text-gray-600 text-center">
              You can select multiple options
            </p>
          </form>

          <!-- Already Voted Message -->
          <div v-else class="text-center py-8">
            <div class="text-6xl mb-4">✅</div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Thank you for voting!</h3>
            <p class="text-gray-600 mb-6">Your vote has been recorded successfully</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <RouterLink 
                :to="`/polls/${poll._id}/results`" 
                class="btn btn-primary"
              >
                View Results
              </RouterLink>
              <button 
                v-if="!poll.isClosed"
                @click="withdrawVote"
                class="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                :disabled="voting"
              >
                Withdraw Vote
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Closed Poll Message -->
      <div v-else class="card bg-gray-50">
        <div class="card-body p-6 text-center">
          <div class="text-6xl mb-4">🔒</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">This poll is closed</h3>
          <p class="text-gray-600 mb-6">Voting has ended for this poll</p>
          <RouterLink 
            :to="`/polls/${poll._id}/results`" 
            class="btn btn-primary"
          >
            View Final Results
          </RouterLink>
        </div>
      </div>

      <!-- Real-time Updates Indicator -->
      <div v-if="!poll.isClosed && socketStore.isConnected" class="flex items-center justify-center space-x-2 text-sm text-green-600">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useSocketStore } from '@/stores/socket'
import pollService from '@/services/pollService'
import voteService from '@/services/voteService'

export default {
  name: 'PollDetailView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const toast = useToast()
    const socketStore = useSocketStore()

    const poll = ref(null)
    const loading = ref(true)
    const error = ref('')
    const voting = ref(false)
    const selectedOptions = ref([])
    const hasVoted = ref(false)
    const userVote = ref(null)

    const pollId = computed(() => route.params.id)

    const fetchPollData = async () => {
      try {
        loading.value = true
        error.value = ''

        const [pollResponse, voteCheckResponse] = await Promise.all([
          pollService.getPoll(pollId.value),
          voteService.checkUserVote(pollId.value)
        ])

        poll.value = pollResponse.data.poll
        hasVoted.value = voteCheckResponse.data.hasVoted
        userVote.value = voteCheckResponse.data.vote

        if (hasVoted.value && userVote.value) {
          selectedOptions.value = [...userVote.value.selectedOptions]
        }

        // Join socket room for real-time updates
        if (socketStore.isConnected) {
          socketStore.joinPoll(pollId.value)
        }

      } catch (err) {
        console.error('Error fetching poll data:', err)
        error.value = err.response?.data?.message || 'Failed to load poll'
      } finally {
        loading.value = false
      }
    }

    const toggleOption = (index) => {
      if (poll.value.allowMultiple) {
        const optionIndex = selectedOptions.value.indexOf(index)
        if (optionIndex > -1) {
          selectedOptions.value.splice(optionIndex, 1)
        } else {
          selectedOptions.value.push(index)
        }
      } else {
        selectedOptions.value = [index]
      }
    }

    const handleVote = async () => {
      if (selectedOptions.value.length === 0) {
        toast.error('Please select at least one option')
        return
      }

      try {
        voting.value = true

        const voteData = {
          pollId: pollId.value,
          selectedOptions: selectedOptions.value
        }

        const response = await voteService.submitVote(voteData)

        if (response.status === 'success') {
          toast.success('Vote submitted successfully!')
          hasVoted.value = true
          userVote.value = response.data.vote
          
          // Update poll data
          await fetchPollData()
        }
      } catch (err) {
        console.error('Error submitting vote:', err)
        toast.error(err.response?.data?.message || 'Failed to submit vote')
      } finally {
        voting.value = false
      }
    }

    const withdrawVote = async () => {
      if (!confirm('Are you sure you want to withdraw your vote?')) {
        return
      }

      try {
        voting.value = true
        await voteService.withdrawVote(pollId.value)
        
        toast.success('Vote withdrawn successfully')
        hasVoted.value = false
        userVote.value = null
        selectedOptions.value = []
        
        // Update poll data
        await fetchPollData()
      } catch (err) {
        console.error('Error withdrawing vote:', err)
        toast.error(err.response?.data?.message || 'Failed to withdraw vote')
      } finally {
        voting.value = false
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

    // Socket event handlers
    const handleVoteUpdate = (data) => {
      if (data.pollId === pollId.value && poll.value) {
        // Update poll with new vote data
        poll.value.totalVotes = data.totalVotes
        data.results.options.forEach((newOption, index) => {
          if (poll.value.options[index]) {
            poll.value.options[index].votes = newOption.votes
          }
        })
        
        toast.info(`New vote from ${data.votedBy}`)
      }
    }

    const handlePollClosed = (data) => {
      if (data.pollId === pollId.value && poll.value) {
        poll.value.isClosed = true
        toast.info('This poll has been closed')
      }
    }

    onMounted(() => {
      fetchPollData()

      // Set up socket listeners
      socketStore.on('voteUpdate', handleVoteUpdate)
      socketStore.on('pollClosed', handlePollClosed)
    })

    onUnmounted(() => {
      // Leave socket room and remove listeners
      if (socketStore.isConnected) {
        socketStore.leavePoll(pollId.value)
      }
      socketStore.off('voteUpdate', handleVoteUpdate)
      socketStore.off('pollClosed', handlePollClosed)
    })

    return {
      poll,
      loading,
      error,
      voting,
      selectedOptions,
      hasVoted,
      socketStore,
      toggleOption,
      handleVote,
      withdrawVote,
      formatDate,
      getInitials
    }
  }
}
</script>