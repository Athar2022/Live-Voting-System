const Poll = require('../models/Poll');
const { validationResult } = require('express-validator');

// Create new poll
exports.createPoll = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, options, closesAt, allowMultiple, isPublic } = req.body;

    // Validate that there are at least 2 options
    if (!options || options.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Poll must have at least 2 options'
      });
    }

    // Create poll object
    const pollData = {
      title,
      description,
      options: options.map(opt => ({ text: opt })),
      createdBy: req.user.id,
      allowMultiple: allowMultiple || false,
      isPublic: isPublic !== undefined ? isPublic : true
    };

    // Add closing date if provided
    if (closesAt) {
      pollData.closesAt = new Date(closesAt);
    }

    const poll = await Poll.create(pollData);

    res.status(201).json({
      status: 'success',
      message: 'Poll created successfully',
      data: {
        poll
      }
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating poll',
      error: error.message
    });
  }
};

// Get all polls (with pagination and filtering)
exports.getPolls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { isActive: true };
    
    // Filter by user if requested
    if (req.query.userId) {
      filter.createdBy = req.query.userId;
    }
    
    // Filter by status
    if (req.query.status === 'active') {
      filter.isClosed = false;
      filter.$or = [
        { closesAt: { $exists: false } },
        { closesAt: { $gt: new Date() } }
      ];
    } else if (req.query.status === 'closed') {
      filter.isClosed = true;
    } else if (req.query.status === 'expired') {
      filter.$or = [
        { isClosed: true },
        { closesAt: { $lte: new Date() } }
      ];
    }

    // Get polls with population
    const polls = await Poll.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Poll.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: polls.length,
      data: {
        polls
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching polls',
      error: error.message
    });
  }
};

// Get single poll by ID
exports.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!poll) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    // Check if poll is active and accessible
    if (!poll.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        poll
      }
    });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching poll',
      error: error.message
    });
  }
};

// Update poll
exports.updatePoll = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    // Check if user owns the poll or is admin
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this poll'
      });
    }

    // Prevent updating if poll has votes
    if (poll.totalVotes > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update poll that has votes'
      });
    }

    const { title, description, options, closesAt, allowMultiple, isPublic } = req.body;

    // Update fields
    if (title) poll.title = title;
    if (description !== undefined) poll.description = description;
    if (options) poll.options = options.map(opt => ({ text: opt }));
    if (closesAt !== undefined) poll.closesAt = closesAt ? new Date(closesAt) : null;
    if (allowMultiple !== undefined) poll.allowMultiple = allowMultiple;
    if (isPublic !== undefined) poll.isPublic = isPublic;

    await poll.save();

    res.status(200).json({
      status: 'success',
      message: 'Poll updated successfully',
      data: {
        poll
      }
    });
  } catch (error) {
    console.error('Update poll error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating poll',
      error: error.message
    });
  }
};

// Delete poll (soft delete)
exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    // Check if user owns the poll or is admin
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this poll'
      });
    }

    // Soft delete by setting isActive to false
    poll.isActive = false;
    await poll.save();

    res.status(200).json({
      status: 'success',
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting poll',
      error: error.message
    });
  }
};

// Close poll
exports.closePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        status: 'error',
        message: 'Poll not found'
      });
    }

    // Check if user owns the poll or is admin
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to close this poll'
      });
    }

    if (poll.isClosed) {
      return res.status(400).json({
        status: 'error',
        message: 'Poll is already closed'
      });
    }

    await poll.closePoll();

    res.status(200).json({
      status: 'success',
      message: 'Poll closed successfully',
      data: {
        poll
      }
    });
  } catch (error) {
    console.error('Close poll error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error closing poll',
      error: error.message
    });
  }
};

// Get user's polls
exports.getMyPolls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { createdBy: req.user.id, isActive: true };

    const polls = await Poll.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Poll.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: polls.length,
      data: {
        polls
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get my polls error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching your polls',
      error: error.message
    });
  }
};