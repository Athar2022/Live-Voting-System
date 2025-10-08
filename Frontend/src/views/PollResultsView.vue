<template>
  <div class="max-w-6xl mx-auto">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div
        class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"
      ></div>
      <p class="text-gray-600">Loading results...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card text-center py-12">
      <div class="text-6xl mb-4">❌</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        Unable to Load Results
      </h3>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <RouterLink :to="`/polls/${pollId}`" class="btn btn-primary">
        Back to Poll
      </RouterLink>
    </div>

    <!-- Results Content -->
    <div v-else-if="results" class="space-y-6">
      <!-- Header -->
      <div class="card">
        <div class="card-body p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ results.poll.title }}
              </h1>
              <p class="text-gray-600 text-lg">Live Results</p>
            </div>
            <div class="flex flex-col items-end space-y-2">
              <span
                :class="[
                  'px-4 py-2 rounded-full text-sm font-medium',
                  results.poll.isClosed
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800',
                ]"
              >
                {{ results.poll.isClosed ? "Final Results" : "Live Results" }}
              </span>
              <span class="text-2xl font-bold text-primary-600">
                {{ results.poll.totalVotes }} votes
              </span>
            </div>
          </div>

          <!-- User Vote Indicator -->
          <div
            v-if="results.userVote"
            class="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4"
          >
            <div class="flex items-center space-x-3">
              <svg
                class="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p class="text-primary-900 font-medium">You voted for:</p>
                <p class="text-primary-700">
                  {{ getUserVoteText(results.userVote.selectedOptions) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Chart -->
      <div class="card">
        <div class="card-body p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            Vote Distribution
          </h2>

          <!-- Chart Container -->
          <div class="h-80">
            <BarChart
              v-if="chartData"
              :data="chartData"
              :options="chartOptions"
            />
          </div>
        </div>
      </div>

      <!-- Detailed Results -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Results List -->
        <div class="card">
          <div class="card-body p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">
              Detailed Breakdown
            </h3>
            <div class="space-y-4">
              <div
                v-for="(option, index) in results.options"
                :key="index"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                :class="{
                  'bg-primary-50 border-primary-200': isUserVote(index),
                }"
              >
                <div class="flex items-center space-x-3 flex-1">
                  <div
                    class="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                  >
                    {{ String.fromCharCode(65 + index) }}
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ option.text }}</p>
                    <p class="text-sm text-gray-600">
                      {{ option.votes }} vote{{ option.votes !== 1 ? "s" : "" }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold text-primary-600">
                    {{ option.percentage }}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="card">
          <div class="card-body p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Statistics</h3>
            <div class="space-y-4">
              <div
                class="flex justify-between items-center py-3 border-b border-gray-200"
              >
                <span class="text-gray-600">Total Votes</span>
                <span class="font-medium text-gray-900">{{
                  results.poll.totalVotes
                }}</span>
              </div>
              <div
                class="flex justify-between items-center py-3 border-b border-gray-200"
              >
                <span class="text-gray-600">Poll Status</span>
                <span
                  :class="[
                    'font-medium',
                    results.poll.isClosed ? 'text-red-600' : 'text-green-600',
                  ]"
                >
                  {{ results.poll.isClosed ? "Closed" : "Active" }}
                </span>
              </div>
              <div
                class="flex justify-between items-center py-3 border-b border-gray-200"
              >
                <span class="text-gray-600">Multiple Choices</span>
                <span class="font-medium text-gray-900">
                  {{ results.poll.allowMultiple ? "Allowed" : "Not Allowed" }}
                </span>
              </div>
              <div
                v-if="leadingOption"
                class="bg-green-50 border border-green-200 rounded-lg p-4 mt-4"
              >
                <div class="flex items-center space-x-3">
                  <svg
                    class="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <div>
                    <p class="text-green-900 font-medium">Current Leader</p>
                    <p class="text-green-700">
                      {{ leadingOption.text }} ({{ leadingOption.percentage }}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <RouterLink
                :to="`/polls/${pollId}`"
                class="btn btn-outline w-full text-center"
              >
                Back to Poll
              </RouterLink>
              <!-- Add this button in the actions section of PollResultsView -->
              <RouterLink
                v-if="canManagePoll"
                :to="`/polls/${pollId}/analytics`"
                class="btn btn-outline w-full text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                View Analytics
              </RouterLink>
              <button
                v-if="canManagePoll && !results.poll.isClosed"
                @click="closePoll"
                class="btn btn-outline w-full text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              >
                Close Poll
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time Updates Indicator -->
      <div
        v-if="!results.poll.isClosed && socketStore.isConnected"
        class="flex items-center justify-center space-x-2 text-sm text-green-600"
      >
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled - results update in real-time</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/auth";
import { useSocketStore } from "@/stores/socket";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import voteService from "@/services/voteService";
import pollService from "@/services/pollService";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

export default {
  name: "PollResultsView",
  components: {
    BarChart: Bar,
  },
  setup() {
    const route = useRoute();
    const toast = useToast();
    const authStore = useAuthStore();
    const socketStore = useSocketStore();

    const results = ref(null);
    const loading = ref(true);
    const error = ref("");
    const pollId = ref(route.params.id);

    const fetchResults = async () => {
      try {
        loading.value = true;
        error.value = "";

        const response = await voteService.getVoteResults(pollId.value);
        results.value = response.data;

        // Join socket room for real-time updates
        if (socketStore.isConnected) {
          socketStore.joinPoll(pollId.value);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        error.value = err.response?.data?.message || "Failed to load results";
      } finally {
        loading.value = false;
      }
    };

    const closePoll = async () => {
      if (
        !confirm(
          "Are you sure you want to close this poll? This will stop all voting."
        )
      ) {
        return;
      }

      try {
        await pollService.closePoll(pollId.value);
        toast.success("Poll closed successfully");
        await fetchResults(); // Refresh results to show final state
      } catch (err) {
        console.error("Error closing poll:", err);
        toast.error("Failed to close poll");
      }
    };

    // Computed properties
    const chartData = computed(() => {
      if (!results.value) return null;

      return {
        labels: results.value.options.map(
          (opt, index) => `${String.fromCharCode(65 + index)}. ${opt.text}`
        ),
        datasets: [
          {
            label: "Votes",
            data: results.value.options.map((opt) => opt.votes),
            backgroundColor: results.value.options.map((opt, index) =>
              isUserVote(index) ? "#3B82F6" : "#93C5FD"
            ),
            borderColor: results.value.options.map((opt, index) =>
              isUserVote(index) ? "#1D4ED8" : "#60A5FA"
            ),
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      };
    });

    const chartOptions = computed(() => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const option = results.value.options[context.dataIndex];
              return `${option.text}: ${option.votes} votes (${option.percentage}%)`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
          title: {
            display: true,
            text: "Number of Votes",
          },
        },
        x: {
          title: {
            display: true,
            text: "Poll Options",
          },
        },
      },
    }));

    const leadingOption = computed(() => {
      if (!results.value) return null;
      return results.value.options.reduce((leading, option) =>
        option.votes > leading.votes ? option : leading
      );
    });

    const canManagePoll = computed(() => {
      if (!results.value || !authStore.user) return false;
      return (
        authStore.user._id === results.value.poll.createdBy ||
        authStore.user.role === "admin"
      );
    });

    const isUserVote = (optionIndex) => {
      return (
        results.value.userVote &&
        results.value.userVote.selectedOptions.includes(optionIndex)
      );
    };

    const getUserVoteText = (selectedOptions) => {
      if (!results.value) return "";
      return selectedOptions
        .map(
          (index) =>
            `${String.fromCharCode(65 + index)}. ${
              results.value.options[index].text
            }`
        )
        .join(", ");
    };

    // Socket event handlers
    const handleVoteUpdate = (data) => {
      if (data.pollId === pollId.value && results.value) {
        // Update results with new data
        results.value.poll.totalVotes = data.totalVotes;
        results.value.options = data.results.options;

        toast.info("Results updated with new vote");
      }
    };

    const handlePollClosed = (data) => {
      if (data.pollId === pollId.value && results.value) {
        results.value.poll.isClosed = true;
        toast.info("Poll has been closed - showing final results");
      }
    };

    onMounted(() => {
      fetchResults();

      // Set up socket listeners
      socketStore.on("voteUpdate", handleVoteUpdate);
      socketStore.on("pollClosed", handlePollClosed);
    });

    onUnmounted(() => {
      // Leave socket room and remove listeners
      if (socketStore.isConnected) {
        socketStore.leavePoll(pollId.value);
      }
      socketStore.off("voteUpdate", handleVoteUpdate);
      socketStore.off("pollClosed", handlePollClosed);
    });

    return {
      results,
      loading,
      error,
      pollId,
      chartData,
      chartOptions,
      leadingOption,
      canManagePoll,
      socketStore,
      closePoll,
      isUserVote,
      getUserVoteText,
    };
  },
};
</script>
