import api from './api'

class VoteService {
  async submitVote(voteData) {
    const response = await api.post('/votes', voteData)
    return response.data
  }

  async getVoteResults(pollId) {
    const response = await api.get(`/votes/results/${pollId}`)
    return response.data
  }

  async getUserVotes(params = {}) {
    const response = await api.get('/votes/my-votes', { params })
    return response.data
  }

  async checkUserVote(pollId) {
    const response = await api.get(`/votes/check/${pollId}`)
    return response.data
  }

  async withdrawVote(pollId) {
    const response = await api.delete(`/votes/${pollId}`)
    return response.data
  }

  async getVoteAnalytics(pollId) {
    const response = await api.get(`/votes/analytics/${pollId}`)
    return response.data
  }

   async exportVotes(pollId, format = 'json') {
    const response = await api.get(`/votes/export/${pollId}`, {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    })
    return response.data
  }
}


export default new VoteService()