const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [200, 'Option text cannot exceed 200 characters']
  },
  votes: {
    type: Number,
    default: 0
  }
});

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Poll title is required'],
    trim: true,
    maxlength: [200, 'Poll title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  options: [optionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  closesAt: {
    type: Date,
    validate: {
      validator: function(value) {
        // Validate that closesAt is in the future if provided
        return !value || value > new Date();
      },
      message: 'Closing date must be in the future'
    }
  },
  allowMultiple: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  totalVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
pollSchema.index({ createdBy: 1, createdAt: -1 });
pollSchema.index({ isActive: 1, isClosed: 1 });

// Virtual for checking if poll is expired
pollSchema.virtual('isExpired').get(function() {
  return this.closesAt && this.closesAt <= new Date();
});

// Method to check if poll can accept votes
pollSchema.methods.canVote = function() {
  return this.isActive && !this.isClosed && !this.isExpired;
};

// Method to close poll
pollSchema.methods.closePoll = function() {
  this.isClosed = true;
  return this.save();
};

// Static method to get active polls
pollSchema.statics.getActivePolls = function() {
  return this.find({
    isActive: true,
    isClosed: false,
    $or: [
      { closesAt: { $exists: false } },
      { closesAt: { $gt: new Date() } }
    ]
  });
};

module.exports = mongoose.model('Poll', pollSchema);