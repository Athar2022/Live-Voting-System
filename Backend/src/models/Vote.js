const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  poll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  selectedOptions: [{
    type: Number, // Index of the selected option in the poll's options array
    required: true
  }],
  votedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one vote per user per poll (for single choice polls)
voteSchema.index({ user: 1, poll: 1 }, { unique: true });

// Method to check if vote is for multiple options
voteSchema.methods.isMultiple = function() {
  return this.selectedOptions.length > 1;
};

// Static method to get vote count for a poll
voteSchema.statics.getVoteCount = async function(pollId) {
  return this.countDocuments({ poll: pollId });
};

// Static method to get user's vote for a poll
voteSchema.statics.getUserVote = async function(userId, pollId) {
  return this.findOne({ user: userId, poll: pollId });
};

module.exports = mongoose.model('Vote', voteSchema);