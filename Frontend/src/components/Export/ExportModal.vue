<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Export Poll Data</h3>
        <p class="text-sm text-gray-600 mt-1">Choose format and options for export</p>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Format Selection -->
        <div>
          <label class="form-label">Export Format</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="format in exportFormats"
              :key="format.id"
              @click="selectedFormat = format.id"
              :class="[
                'p-4 border rounded-lg text-left transition-all duration-200',
                selectedFormat === format.id
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <div class="flex items-center space-x-3">
                <div :class="['p-2 rounded', format.bgColor]">
                  <component :is="format.icon" class="w-5 h-5 text-white" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ format.name }}</p>
                  <p class="text-sm text-gray-600">{{ format.description }}</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Options -->
        <div v-if="selectedFormat === 'csv'">
          <label class="flex items-center space-x-3">
            <input
              v-model="includeUserInfo"
              type="checkbox"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700">Include voter information (username, email)</span>
          </label>
        </div>

        <!-- Preview -->
        <div v-if="previewData" class="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
          <pre class="text-xs text-gray-600 whitespace-pre-wrap">{{ previewData }}</pre>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="btn btn-outline"
        >
          Cancel
        </button>
        <button
          @click="handleExport"
          :disabled="exporting"
          class="btn btn-primary"
        >
          <span
            v-if="exporting"
            class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
          ></span>
          {{ exporting ? 'Exporting...' : 'Export Data' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

// Icons
const JsonIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  `
}

const CsvIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  `
}

export default {
  name: 'ExportModal',
  components: {
    JsonIcon,
    CsvIcon
  },
  props: {
    poll: {
      type: Object,
      required: true
    },
    analytics: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const toast = useToast()

    const selectedFormat = ref('json')
    const includeUserInfo = ref(false)
    const exporting = ref(false)

    const exportFormats = [
      {
        id: 'json',
        name: 'JSON',
        description: 'Structured data format',
        bgColor: 'bg-green-500',
        icon: 'JsonIcon'
      },
      {
        id: 'csv',
        name: 'CSV',
        description: 'Spreadsheet format',
        bgColor: 'bg-blue-500',
        icon: 'CsvIcon'
      }
    ]

    const previewData = computed(() => {
      if (!props.poll) return null

      const baseData = {
        poll: {
          id: props.poll._id,
          title: props.poll.title,
          description: props.poll.description,
          totalVotes: props.poll.totalVotes,
          isClosed: props.poll.isClosed,
          createdAt: props.poll.createdAt
        },
        options: props.poll.options.map((opt, index) => ({
          index,
          text: opt.text,
          votes: opt.votes,
          percentage: opt.percentage
        })),
        exportDate: new Date().toISOString()
      }

      if (selectedFormat.value === 'json') {
        return JSON.stringify(baseData, null, 2)
      } else {
        // CSV preview - just show headers
        const headers = ['Option', 'Votes', 'Percentage']
        return headers.join(',') + '\n...'
      }

      return null
    })

    const handleExport = async () => {
      try {
        exporting.value = true

        // In a real implementation, this would call the backend export endpoint
        // For now, we'll simulate the export
        
        const data = {
          pollId: props.poll._id,
          format: selectedFormat.value,
          includeUserInfo: includeUserInfo.value
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        toast.success(`Data exported as ${selectedFormat.value.toUpperCase()}`)
        
        // Trigger download in real implementation
        // this.downloadFile(data, selectedFormat.value)
        
        emit('close')
      } catch (error) {
        console.error('Export error:', error)
        toast.error('Failed to export data')
      } finally {
        exporting.value = false
      }
    }

    const downloadFile = (data, format) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `poll-${props.poll._id}-${new Date().getTime()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    onMounted(() => {
      // Add escape key listener
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          emit('close')
        }
      }
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    })

    return {
      selectedFormat,
      includeUserInfo,
      exporting,
      exportFormats,
      previewData,
      handleExport
    }
  }
}
</script>