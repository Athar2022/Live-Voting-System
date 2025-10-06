const { getIO } = require('./socket');

// Real-time service for emitting events from controllers
class RealTimeService {
  // Emit when a new poll is created
  static emitNewPoll(poll) {
    const io = getIO();
    
    io.emitToNewPollSubscribers('newPoll', {
      poll: {
        id: poll._id,
        title: poll.title,
        description: poll.description,
        createdBy: poll.createdBy,
        createdAt: poll.createdAt,
        totalOptions: poll.options.length
      },
      message: `New poll created: ${poll.title}`
    });

    // Notify admins
    io.emitToAdmins('adminNewPoll', {
      pollId: poll._id,
      title: poll.title,
      createdBy: poll.createdBy,
      timestamp: new Date().toISOString()
    });
  }

  // Emit when a poll is closed
  static emitPollClosed(poll) {
    const io = getIO();
    
    io.emitToPoll(poll._id, 'pollClosed', {
      pollId: poll._id,
      title: poll.title,
      finalResults: poll.options.map((option, index) => ({
        index,
        text: option.text,
        votes: option.votes,
        percentage: poll.totalVotes > 0 
          ? Math.round((option.votes / poll.totalVotes) * 100) 
          : 0
      })),
      totalVotes: poll.totalVotes,
      closedAt: new Date().toISOString()
    });

    // Notify the poll creator
    io.emitToUser(poll.createdBy, 'yourPollClosed', {
      pollId: poll._id,
      title: poll.title,
      totalVotes: poll.totalVotes,
      message: `Your poll "${poll.title}" has been closed`
    });
  }

  // Emit when a vote is submitted
  static async emitVoteSubmitted(pollId, userId) {
    const io = getIO();
    const Poll = require('../models/Poll');
    const User = require('../models/User');

    try {
      const poll = await Poll.findById(pollId);
      const user = await User.findById(userId);

      if (!poll || !user) return;

      const voteResults = {
        options: poll.options.map((option, index) => ({
          index,
          text: option.text,
          votes: option.votes,
          percentage: poll.totalVotes > 0 
            ? Math.round((option.votes / poll.totalVotes) * 100) 
            : 0
        })),
        totalVotes: poll.totalVotes
      };

      io.emitToPoll(pollId, 'voteUpdate', {
        pollId,
        results: voteResults,
        totalVotes: poll.totalVotes,
        votedBy: user.username,
        timestamp: new Date().toISOString()
      });

      // Notify poll owner about new vote (if not the owner)
      if (poll.createdBy.toString() !== userId.toString()) {
        io.emitToUser(poll.createdBy, 'newVoteOnYourPoll', {
          pollId: poll._id,
          title: poll.title,
          votedBy: user.username,
          totalVotes: poll.totalVotes,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error emitting vote submitted:', error);
    }
  }

  // Emit when a poll is deleted
  static emitPollDeleted(pollId, pollTitle, deletedBy) {
    const io = getIO();
    
    io.emitToPoll(pollId, 'pollDeleted', {
      pollId,
      message: `The poll "${pollTitle}" has been deleted`,
      deletedBy,
      timestamp: new Date().toISOString()
    });
  }

  // Emit system-wide notification
  static emitSystemNotification(title, message, type = 'info') {
    const io = getIO();
    
    io.emitToAll('systemNotification', {
      title,
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  // Emit admin statistics update
  static emitAdminStats(stats) {
    const io = getIO();
    
    io.emitToAdmins('adminStatsUpdate', {
      stats,
      timestamp: new Date().toISOString()
    });
  }

  // Get real-time statistics
  static getRealtimeStats() {
    const io = getIO();
    
    return {
      connectedUsers: io.getConnectedUsers().length,
      activePolls: Array.from(io.sockets.adapter.rooms.keys())
        .filter(room => room.startsWith('poll_')).length,
      totalConnections: io.sockets.sockets.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = RealTimeService;