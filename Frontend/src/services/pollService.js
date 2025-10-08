import api from './api'

class PollService {
  async getPolls(params = {}) {
    const response = await api.get('/polls', { params })
    return response.data
  }

  async getPoll(id) {
    const response = await api.get(`/polls/${id}`)
    return response.data
  }

  async createPoll(pollData) {
    const response = await api.post('/polls', pollData)
    return response.data
  }

  async updatePoll(id, pollData) {
    const response = await api.put(`/polls/${id}`, pollData)
    return response.data
  }

  async deletePoll(id) {
    const response = await api.delete(`/polls/${id}`)
    return response.data
  }

  async closePoll(id) {
    const response = await api.patch(`/polls/${id}/close`)
    return response.data
  }

  async getMyPolls(params = {}) {
    const response = await api.get('/polls/my-polls', { params })
    return response.data
  }

  async getPollStats(id) {
    const response = await api.get(`/polls/${id}/stats`)
    return response.data
  }
}

export default new PollService()