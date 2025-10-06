const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: User not found or inactive'));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Socket event handlers
const setupSocketHandlers = (socket) => {
  console.log(`🔌 User ${socket.user.username} connected with socket ID: ${socket.id}`);

  // Join user to their personal room for notifications
  socket.join(`user_${socket.user._id}`);

  // Handle poll room joining
  socket.on('joinPoll', async (pollId) => {
    try {
      const Poll = require('../models/Poll');
      const poll = await Poll.findById(pollId);
      
      if (!poll || !poll.isActive) {
        socket.emit('error', { message: 'Poll not found or inactive' });
        return;
      }

      // Check if user can access this poll
      if (!poll.isPublic && poll.createdBy.toString() !== socket.user._id.toString() && socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Not authorized to access this poll' });
        return;
      }

      socket.join(`poll_${pollId}`);
      console.log(`👥 User ${socket.user.username} joined poll room: poll_${pollId}`);

      // Send current poll data to the user
      const voteResults = await getVoteResults(pollId);
      socket.emit('pollData', {
        pollId,
        results: voteResults,
        totalVotes: poll.totalVotes,
        isClosed: poll.isClosed
      });

    } catch (error) {
      console.error('Join poll error:', error);
      socket.emit('error', { message: 'Error joining poll' });
    }
  });

  // Handle poll room leaving
  socket.on('leavePoll', (pollId) => {
    socket.leave(`poll_${pollId}`);
    console.log(`🚪 User ${socket.user.username} left poll room: poll_${pollId}`);
  });

  // Handle real-time voting
  socket.on('submitVote', async (data) => {
    try {
      const { pollId, selectedOptions } = data;
      
      // Validate input
      if (!pollId || !selectedOptions || !Array.isArray(selectedOptions)) {
        socket.emit('voteError', { message: 'Invalid vote data' });
        return;
      }

      const Vote = require('../models/Vote');
      const Poll = require('../models/Poll');

      // Check if user has already voted (for single choice polls)
      const poll = await Poll.findById(pollId);
      if (!poll.allowMultiple) {
        const existingVote = await Vote.getUserVote(socket.user._id, pollId);
        if (existingVote) {
          socket.emit('voteError', { message: 'You have already voted in this poll' });
          return;
        }
      }

      // Process vote (simplified - in production, use the controller)
      const vote = await Vote.create({
        user: socket.user._id,
        poll: pollId,
        selectedOptions
      });

      // Update poll counts
      for (const optionIndex of selectedOptions) {
        poll.options[optionIndex].votes += 1;
      }
      poll.totalVotes += 1;
      await poll.save();

      // Get updated results
      const voteResults = await getVoteResults(pollId);

      // Broadcast to all users in the poll room
      io.to(`poll_${pollId}`).emit('voteUpdate', {
        pollId,
        results: voteResults,
        totalVotes: poll.totalVotes,
        votedBy: socket.user.username
      });

      // Send confirmation to the voter
      socket.emit('voteSuccess', {
        message: 'Vote submitted successfully',
        selectedOptions
      });

    } catch (error) {
      console.error('Real-time vote error:', error);
      socket.emit('voteError', { 
        message: 'Error submitting vote',
        error: error.message
      });
    }
  });

  // Handle poll creation notifications
  socket.on('subscribeToNewPolls', () => {
    socket.join('new_polls');
    console.log(`📢 User ${socket.user.username} subscribed to new polls`);
  });

  // Handle admin notifications
  socket.on('subscribeToAdmin', () => {
    if (socket.user.role === 'admin') {
      socket.join('admin_notifications');
      console.log(`⚡ Admin ${socket.user.username} subscribed to admin notifications`);
    }
  });

  // Handle connection ping (for monitoring)
  socket.on('ping', (callback) => {
    if (typeof callback === 'function') {
      callback({
        status: 'pong',
        userId: socket.user._id,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ User ${socket.user.username} disconnected: ${reason}`);
    
    // Clean up any temporary rooms or data
    cleanupSocket(socket);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`💥 Socket error for user ${socket.user.username}:`, error);
  });
};

// Helper function to get vote results
const getVoteResults = async (pollId) => {
  try {
    const Poll = require('../models/Poll');
    const poll = await Poll.findById(pollId);
    
    if (!poll) return null;

    return {
      options: poll.options.map((option, index) => ({
        index,
        text: option.text,
        votes: option.votes,
        percentage: poll.totalVotes > 0 
          ? Math.round((option.votes / poll.totalVotes) * 100) 
          : 0
      })),
      totalVotes: poll.totalVotes,
      isClosed: poll.isClosed
    };
  } catch (error) {
    console.error('Get vote results error:', error);
    return null;
  }
};

// Cleanup function for disconnected sockets
const cleanupSocket = (socket) => {
  // Remove from any temporary rooms or clean up resources
  // This can be expanded based on application needs
};

// Initialize Socket.io
exports.init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    // Enable connection state recovery
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true
    }
  });

  // Use authentication middleware
  io.use(authenticateSocket);

  // Set up connection handler
  io.on('connection', setupSocketHandlers);

  // Store connected users for monitoring
  io.connectedUsers = new Map();

  console.log('🚀 Socket.io server initialized with authentication');
  return io;
};

// Get Socket.io instance
exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Utility functions for emitting events from controllers
exports.emitToPoll = (pollId, event, data) => {
  if (io) {
    io.to(`poll_${pollId}`).emit(event, data);
  }
};

exports.emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

exports.emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

exports.emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin_notifications').emit(event, data);
  }
};

exports.emitToNewPollSubscribers = (event, data) => {
  if (io) {
    io.to('new_polls').emit(event, data);
  }
};

// Get connected users count for a poll
exports.getPollConnectionsCount = (pollId) => {
  if (!io) return 0;
  
  const room = io.sockets.adapter.rooms.get(`poll_${pollId}`);
  return room ? room.size : 0;
};

// Get all connected users
exports.getConnectedUsers = () => {
  if (!io) return [];
  
  const users = [];
  io.sockets.sockets.forEach(socket => {
    if (socket.user) {
      users.push({
        socketId: socket.id,
        userId: socket.user._id,
        username: socket.user.username,
        role: socket.user.role
      });
    }
  });
  return users;
};