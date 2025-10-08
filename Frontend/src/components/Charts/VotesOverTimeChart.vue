<template>
  <div class="chart-container">
    <Line 
      v-if="chartData"
      :data="chartData"
      :options="chartOptions"
    />
    <div v-else class="flex items-center justify-center h-full text-gray-500">
      No time-series data available
    </div>
  </div>
</template>

<script>
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Colors
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Colors)

export default {
  name: 'VotesOverTimeChart',
  components: { Line },
  props: {
    analytics: {
      type: Object,
      default: null
    }
  },
  computed: {
    chartData() {
      if (!this.analytics?.votesOverTime?.length) return null

      const labels = this.analytics.votesOverTime.map(item => item._id)
      const data = this.analytics.votesOverTime.map(item => item.count)

      return {
        labels,
        datasets: [
          {
            label: 'Votes per Day',
            data,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: true
          }
        ]
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false
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
              color: '#374151'
            }
          },
          x: {
            grid: {
              color: 'rgba(243, 244, 246, 1)'
            },
            ticks: {
              color: '#6B7280'
            },
            title: {
              display: true,
              text: 'Date',
              color: '#374151'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'nearest'
        }
      }
    }
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}
</style>