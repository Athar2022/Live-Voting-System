const Vote = require('../models/Vote');
const Poll = require('../models/Poll');
const { validationResult } = require('express-validator');
const RealTimeService = require('../utils/realTimeService');

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

      // Emit real-time notification
      RealTimeService.emitVoteSubmitted(pollId, userId);

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

    // Check if user can view results
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      // For public polls, allow viewing results only if poll is closed or user has voted
      if (!poll.isPublic) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to view these results'
        });
      }
      
      // For public active polls, check if user has voted or if results are public
      if (!poll.isClosed) {
        const userVote = await Vote.getUserVote(req.user.id, pollId);
        if (!userVote) {
          return res.status(403).json({
            status: 'error',
            message: 'You must vote first to see the results'
          });
        }
      }
    }

    const results = {
      poll: {
        id: poll._id,
        title: poll.title,
        totalVotes: poll.totalVotes,
        isClosed: poll.isClosed,
        allowMultiple: poll.allowMultiple,
        createdBy: poll.createdBy
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
        select: 'title description isActive isClosed totalVotes createdAt closesAt',
        match: { isActive: true },
        populate: {
          path: 'createdBy',
          select: 'username'
        }
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

    // Check if poll allows vote withdrawal
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
      RealTimeService.emitVoteSubmitted(pollId, userId);

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

// Get detailed vote analytics for a poll (admin/owner only)
exports.getVoteAnalytics = async (req, res) => {
  try {
    const pollId = req.params.pollId;

    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    // Check if user owns the poll or is admin
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view analytics for this poll'
      });
    }

    // Get votes with user information
    const votes = await Vote.find({ poll: pollId })
      .populate('user', 'username email')
      .sort({ votedAt: -1 });

    // Get vote distribution by time
    const votesByHour = await Vote.aggregate([
      { $match: { poll: poll._id } },
      {
        $group: {
          _id: { $hour: "$votedAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get option popularity over time
    const optionTrends = await Vote.aggregate([
      { $match: { poll: poll._id } },
      {
        $unwind: "$selectedOptions"
      },
      {
        $group: {
          _id: {
            option: "$selectedOptions",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$votedAt" } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.option",
          trends: {
            $push: {
              date: "$_id.date",
              votes: "$count"
            }
          }
        }
      }
    ]);

    const analytics = {
      poll: {
        id: poll._id,
        title: poll.title,
        totalVotes: poll.totalVotes,
        createdAt: poll.createdAt,
        closesAt: poll.closesAt,
        isClosed: poll.isClosed
      },
      votes: votes.map(vote => ({
        user: {
          username: vote.user.username,
          email: vote.user.email
        },
        selectedOptions: vote.selectedOptions,
        votedAt: vote.votedAt
      })),
      votesByHour,
      optionTrends,
      summary: {
        averageOptionsPerVote: poll.allowMultiple ? 
          (votes.reduce((sum, vote) => sum + vote.selectedOptions.length, 0) / votes.length).toFixed(2) : 1,
        mostPopularOption: poll.options.reduce((max, option, index) => 
          option.votes > max.votes ? { index, ...option.toObject() } : max, 
          { index: 0, votes: -1 }
        ),
        voteRatePerHour: votes.length > 0 ? 
          (votes.length / ((new Date() - poll.createdAt) / (1000 * 60 * 60))).toFixed(2) : 0
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        analytics
      }
    });

  } catch (error) {
    console.error('Get vote analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching vote analytics',
      error: error.message
    });
  }
};

// Export poll votes data (admin/owner only)
exports.exportVotes = async (req, res) => {
  try {
    const pollId = req.params.pollId;
    const format = req.query.format || 'json';

    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    // Check if user owns the poll or is admin
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to export votes for this poll'
      });
    }

    const votes = await Vote.find({ poll: pollId })
      .populate('user', 'username email')
      .sort({ votedAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = ['Username', 'Email', 'Selected Options', 'Voted At'];
      const csvData = votes.map(vote => [
        vote.user.username,
        vote.user.email,
        vote.selectedOptions.map(opt => poll.options[opt].text).join('; '),
        vote.votedAt.toISOString()
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="votes_${pollId}.csv"`);
      return res.send(csvContent);
    }

    // Default JSON format
    res.status(200).json({
      status: 'success',
      data: {
        poll: {
          id: poll._id,
          title: poll.title,
          description: poll.description
        },
        votes: votes.map(vote => ({
          user: {
            username: vote.user.username,
            email: vote.user.email
          },
          selectedOptions: vote.selectedOptions.map(optIndex => ({
            index: optIndex,
            text: poll.options[optIndex].text
          })),
          votedAt: vote.votedAt
        })),
        exportDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Export votes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error exporting votes',
      error: error.message
    });
  }
};