import api from './api'

class PollService {
  // ... existing methods ...

  // Reopen poll
  async reopenPoll(id) {
    const response = await api.patch(`/polls/${id}/reopen`)
    return response.data
  }
}

export default new PollService()