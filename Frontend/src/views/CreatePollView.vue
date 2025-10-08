<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Create New Poll</h1>
      <p class="text-gray-600">Create a poll for the community to vote on</p>
    </div>

    <!-- Create Poll Form -->
    <div class="card">
      <div class="card-body p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Poll Title -->
          <div class="form-group">
            <label for="title" class="form-label">Poll Title *</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              class="form-input"
              placeholder="Enter a clear and descriptive title"
              required
              maxlength="200"
            />
            <div class="flex justify-between items-center mt-1">
              <p class="text-xs text-gray-500">This will be the main heading for your poll</p>
              <span class="text-xs text-gray-500">{{ form.title.length }}/200</span>
            </div>
          </div>

          <!-- Poll Description -->
          <div class="form-group">
            <label for="description" class="form-label">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              class="form-input form-textarea"
              placeholder="Provide more details about your poll (optional)"
              rows="3"
              maxlength="500"
            ></textarea>
            <div class="flex justify-between items-center mt-1">
              <p class="text-xs text-gray-500">Additional context for voters</p>
              <span class="text-xs text-gray-500">{{ form.description.length }}/500</span>
            </div>
          </div>

          <!-- Poll Options -->
          <div class="form-group">
            <label class="form-label">Poll Options *</label>
            <p class="text-sm text-gray-600 mb-4">Add at least 2 options for voters to choose from</p>
            
            <div class="space-y-3">
              <div 
                v-for="(option, index) in form.options" 
                :key="index"
                class="flex items-center space-x-3"
              >
                <div class="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {{ String.fromCharCode(65 + index) }}
                </div>
                <input
                  v-model="form.options[index]"
                  type="text"
                  class="form-input flex-1"
                  :placeholder="`Option ${index + 1}`"
                  required
                  maxlength="200"
                />
                <button
                  v-if="form.options.length > 2"
                  @click="removeOption(index)"
                  type="button"
                  class="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50 flex-shrink-0"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              @click="addOption"
              type="button"
              class="btn btn-outline btn-sm mt-3"
              :disabled="form.options.length >= 10"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Option
            </button>
            <p class="text-xs text-gray-500 mt-1">Maximum 10 options allowed</p>
          </div>

          <!-- Poll Settings -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Multiple Selection -->
            <div class="form-group">
              <label class="flex items-center space-x-3 cursor-pointer">
                <input
                  v-model="form.allowMultiple"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span class="text-sm font-medium text-gray-700">Allow multiple selections</span>
                  <p class="text-xs text-gray-500">Voters can choose more than one option</p>
                </div>
              </label>
            </div>

            <!-- Public/Private -->
            <div class="form-group">
              <label class="flex items-center space-x-3 cursor-pointer">
                <input
                  v-model="form.isPublic"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  :true-value="true"
                  :false-value="false"
                />
                <div>
                  <span class="text-sm font-medium text-gray-700">Public poll</span>
                  <p class="text-xs text-gray-500">Visible to all users (uncheck for private)</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Closing Date -->
          <div class="form-group">
            <label for="closesAt" class="form-label">Closing Date (Optional)</label>
            <input
              id="closesAt"
              v-model="form.closesAt"
              type="datetime-local"
              class="form-input"
              :min="minDate"
            />
            <p class="text-xs text-gray-500 mt-1">
              The poll will automatically close at this date and time
            </p>
          </div>

          <!-- Error Message -->
          <div 
            v-if="error" 
            class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
          >
            {{ error }}
          </div>

          <!-- Form Actions -->
          <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              class="btn btn-primary flex-1"
              :disabled="loading || !isFormValid"
            >
              <span 
                v-if="loading" 
                class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
              ></span>
              {{ loading ? 'Creating Poll...' : 'Create Poll' }}
            </button>
            <RouterLink
              to="/polls"
              class="btn btn-outline flex-1 text-center"
            >
              Cancel
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import pollService from '@/services/pollService'

export default {
  name: 'CreatePollView',
  setup() {
    const router = useRouter()
    const toast = useToast()

    const form = ref({
      title: '',
      description: '',
      options: ['', ''],
      allowMultiple: false,
      isPublic: true,
      closesAt: ''
    })
    const loading = ref(false)
    const error = ref('')

    const minDate = computed(() => {
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      return now.toISOString().slice(0, 16)
    })

    const isFormValid = computed(() => {
      return (
        form.value.title.trim() &&
        form.value.options.length >= 2 &&
        form.value.options.every(opt => opt.trim()) &&
        form.value.options.length === new Set(form.value.options.map(opt => opt.trim())).size
      )
    })

    const addOption = () => {
      if (form.value.options.length < 10) {
        form.value.options.push('')
      }
    }

    const removeOption = (index) => {
      if (form.value.options.length > 2) {
        form.value.options.splice(index, 1)
      }
    }

    const handleSubmit = async () => {
      if (!isFormValid.value) {
        error.value = 'Please fill in all required fields and ensure options are unique'
        return
      }

      try {
        loading.value = true
        error.value = ''

        const pollData = {
          title: form.value.title.trim(),
          description: form.value.description.trim(),
          options: form.value.options.map(opt => opt.trim()),
          allowMultiple: form.value.allowMultiple,
          isPublic: form.value.isPublic,
          closesAt: form.value.closesAt || undefined
        }

        const response = await pollService.createPoll(pollData)

        if (response.status === 'success') {
          toast.success('Poll created successfully!')
          router.push(`/polls/${response.data.poll._id}`)
        }
      } catch (err) {
        console.error('Error creating poll:', err)
        error.value = err.response?.data?.message || 'Failed to create poll'
        toast.error('Failed to create poll')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      error,
      minDate,
      isFormValid,
      addOption,
      removeOption,
      handleSubmit
    }
  }
}
</script>