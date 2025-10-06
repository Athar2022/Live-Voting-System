const Vote = require('../models/Vote');
const Poll = require('../models/Poll');
const { validationResult } = require('express-validator');

// Submit a vote
exports.submitVote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pollId, selectedOptions } = req.body;
    const userId = req.user.id;

    // Find the poll
    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found or inactive'
      });
    }

    // Check if poll is closed or expired
    if (!poll.canVote()) {
      return res.status(400).json({
        status: 'error',
        message: 'This poll is closed and no longer accepting votes'
      });
    }

    // Validate selected options
    if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one option must be selected'
      });
    }

    // Check for duplicate options
    const uniqueOptions = [...new Set(selectedOptions)];
    if (uniqueOptions.length !== selectedOptions.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Duplicate options are not allowed'
      });
    }

    // Validate option indices
    for (const optionIndex of selectedOptions) {
      if (optionIndex < 0 || optionIndex >= poll.options.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid option selected'
        });
      }
    }

    // Check if multiple options are allowed
    if (selectedOptions.length > 1 && !poll.allowMultiple) {
      return res.status(400).json({
        status: 'error',
        message: 'This poll does not allow multiple selections'
      });
    }

    // Check if user has already voted (for single choice polls)
    if (!poll.allowMultiple) {
      const existingVote = await Vote.getUserVote(userId, pollId);
      if (existingVote) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already voted in this poll'
        });
      }
    }

    // Start a session for transaction
    const session = await Vote.startSession();
    session.startTransaction();

    try {
      // Create the vote
      const vote = await Vote.create([{
        user: userId,
        poll: pollId,
        selectedOptions: selectedOptions
      }], { session });

      // Update poll vote counts
      for (const optionIndex of selectedOptions) {
        poll.options[optionIndex].votes += 1;
      }
      poll.totalVotes += 1;

      await poll.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Populate the vote for response
      const populatedVote = await Vote.findById(vote[0]._id)
        .populate('user', 'username email')
        .populate('poll', 'title options');

      // Emit real-time update via Socket.io if available
      if (req.app.get('socketio')) {
        const voteResult = await this.getVoteResults(pollId);
        req.app.get('socketio').to(`poll_${pollId}`).emit('voteUpdate', {
          pollId,
          results: voteResult,
          totalVotes: poll.totalVotes
        });
      }

      res.status(201).json({
        status: 'success',
        message: 'Vote submitted successfully',
        data: {
          vote: populatedVote
        }
      });

    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Submit vote error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already voted in this poll'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Error submitting vote',
      error: error.message
    });
  }
};

// Get vote results for a poll
exports.getVoteResults = async (req, res) => {
  try {
    const pollId = req.params.pollId;

    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    // Check if user can view results (could add more complex logic here)
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      // For public polls, allow viewing results
      if (!poll.isPublic) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to view these results'
        });
      }
    }

    const results = {
      poll: {
        id: poll._id,
        title: poll.title,
        totalVotes: poll.totalVotes,
        isClosed: poll.isClosed,
        allowMultiple: poll.allowMultiple
      },
      options: poll.options.map((option, index) => ({
        index,
        text: option.text,
        votes: option.votes,
        percentage: poll.totalVotes > 0 
          ? Math.round((option.votes / poll.totalVotes) * 100) 
          : 0
      })),
      userVote: null
    };

    // Get user's vote if they have voted
    const userVote = await Vote.getUserVote(req.user.id, pollId);
    if (userVote) {
      results.userVote = {
        selectedOptions: userVote.selectedOptions,
        votedAt: userVote.votedAt
      };
    }

    res.status(200).json({
      status: 'success',
      data: results
    });

  } catch (error) {
    console.error('Get vote results error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching vote results',
      error: error.message
    });
  }
};

// Get user's voting history
exports.getUserVotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const votes = await Vote.find({ user: req.user.id })
      .populate({
        path: 'poll',
        select: 'title description isActive isClosed totalVotes createdAt',
        match: { isActive: true }
      })
      .sort({ votedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out votes for deleted polls
    const filteredVotes = votes.filter(vote => vote.poll !== null);

    const total = await Vote.countDocuments({ 
      user: req.user.id,
      poll: { $in: await Poll.find({ isActive: true }).select('_id') }
    });

    res.status(200).json({
      status: 'success',
      results: filteredVotes.length,
      data: {
        votes: filteredVotes
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get user votes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching your votes',
      error: error.message
    });
  }
};

// Check if user has voted in a poll
exports.checkUserVote = async (req, res) => {
  try {
    const pollId = req.params.pollId;
    const userId = req.user.id;

    const vote = await Vote.getUserVote(userId, pollId);

    res.status(200).json({
      status: 'success',
      data: {
        hasVoted: !!vote,
        vote: vote ? {
          selectedOptions: vote.selectedOptions,
          votedAt: vote.votedAt
        } : null
      }
    });

  } catch (error) {
    console.error('Check user vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking vote status',
      error: error.message
    });
  }
};

// Withdraw vote (if allowed)
exports.withdrawVote = async (req, res) => {
  try {
    const pollId = req.params.pollId;
    const userId = req.user.id;

    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    // Check if poll allows vote withdrawal (you can add this field to Poll model)
    // For now, we'll allow it only if the poll is still active and not closed
    if (!poll.canVote()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot withdraw vote from a closed poll'
      });
    }

    const vote = await Vote.getUserVote(userId, pollId);
    if (!vote) {
      return res.status(404).json({
        status: 'error',
        message: 'You have not voted in this poll'
      });
    }

    const session = await Vote.startSession();
    session.startTransaction();

    try {
      // Remove the vote
      await Vote.deleteOne({ _id: vote._id }, { session });

      // Update poll vote counts
      for (const optionIndex of vote.selectedOptions) {
        poll.options[optionIndex].votes = Math.max(0, poll.options[optionIndex].votes - 1);
      }
      poll.totalVotes = Math.max(0, poll.totalVotes - 1);

      await poll.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Emit real-time update
      if (req.app.get('socketio')) {
        const voteResult = await this.getVoteResults(pollId);
        req.app.get('socketio').to(`poll_${pollId}`).emit('voteUpdate', {
          pollId,
          results: voteResult,
          totalVotes: poll.totalVotes
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Vote withdrawn successfully'
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Withdraw vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error withdrawing vote',
      error: error.message
    });
  }
};