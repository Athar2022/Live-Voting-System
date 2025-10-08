<template>
  <div class="chart-container">
    <Bar 
      v-if="chartData"
      :data="chartData"
      :options="chartOptions"
      :key="chartKey"
    />
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Colors
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Colors, annotationPlugin)

export default {
  name: 'AdvancedBarChart',
  components: { Bar },
  props: {
    data: {
      type: Object,
      required: true
    },
    userVote: {
      type: Object,
      default: null
    },
    animate: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      chartKey: 0
    }
  },
  computed: {
    chartData() {
      if (!this.data || !this.data.options) return null

      return {
        labels: this.data.options.map((opt, index) => 
          `${String.fromCharCode(65 + index)}`
        ),
        datasets: [
          {
            label: 'Votes',
            data: this.data.options.map(opt => opt.votes),
            backgroundColor: this.data.options.map((opt, index) => 
              this.isUserVote(index) ? '#10B981' : '#3B82F6'
            ),
            borderColor: this.data.options.map((opt, index) => 
              this.isUserVote(index) ? '#047857' : '#1D4ED8'
            ),
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: this.animate ? 1000 : 0,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1F2937',
            bodyColor: '#374151',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => {
                const index = context[0].dataIndex
                return this.data.options[index].text
              },
              label: (context) => {
                const option = this.data.options[context.dataIndex]
                return `${option.votes} votes (${option.percentage}%)`
              }
            }
          },
          annotation: {
            annotations: this.getAnnotation()
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(243, 244, 246, 1)'
            },
            ticks: {
              color: '#6B7280',
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Number of Votes',
              color: '#374151',
              font: {
                weight: 'bold'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6B7280',
              font: {
                weight: 'bold'
              }
            },
            title: {
              display: true,
              text: 'Options',
              color: '#374151',
              font: {
                weight: 'bold'
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    }
  },
  watch: {
    data: {
      handler() {
        this.chartKey += 1
      },
      deep: true
    }
  },
  methods: {
    isUserVote(optionIndex) {
      return (
        this.userVote && 
        this.userVote.selectedOptions.includes(optionIndex)
      )
    },
    getAnnotation() {
      if (!this.userVote) return {}

      const annotations = {}
      this.userVote.selectedOptions.forEach(optionIndex => {
        annotations[`userVote-${optionIndex}`] = {
          type: 'box',
          xMin: optionIndex - 0.4,
          xMax: optionIndex + 0.4,
          yMin: 0,
          yMax: 'max',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          borderWidth: 1,
          label: {
            display: true,
            content: 'Your Vote',
            position: 'start',
            backgroundColor: '#10B981',
            color: 'white',
            font: {
              size: 10,
              weight: 'bold'
            },
            padding: 4,
            borderRadius: 4
          }
        }
      })
      return annotations
    }
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>