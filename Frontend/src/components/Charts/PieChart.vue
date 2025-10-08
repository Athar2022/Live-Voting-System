<template>
  <div class="chart-container">
    <Doughnut 
      v-if="chartData"
      :data="chartData"
      :options="chartOptions"
      :key="chartKey"
    />
  </div>
</template>

<script>
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Colors
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, Colors)

export default {
  name: 'PieChart',
  components: { Doughnut },
  props: {
    data: {
      type: Object,
      required: true
    },
    userVote: {
      type: Object,
      default: null
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
          `${String.fromCharCode(65 + index)}. ${this.truncateText(opt.text, 20)}`
        ),
        datasets: [
          {
            data: this.data.options.map(opt => opt.votes),
            backgroundColor: [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
            ],
            borderColor: 'white',
            borderWidth: 2,
            hoverOffset: 8
          }
        ]
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '45%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#374151',
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const option = this.data.options[context.dataIndex]
                return `${option.text}: ${option.votes} votes (${option.percentage}%)`
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
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
    truncateText(text, length) {
      if (text.length <= length) return text
      return text.substring(0, length) + '...'
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