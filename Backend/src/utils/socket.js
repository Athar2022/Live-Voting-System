const socketIO = require('socket.io');

let io;

exports.init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // Join a poll room for real-time updates
    socket.on('joinPoll', (pollId) => {
      socket.join(`poll_${pollId}`);
      console.log(`👥 Socket ${socket.id} joined poll room: poll_${pollId}`);
    });

    // Leave a poll room
    socket.on('leavePoll', (pollId) => {
      socket.leave(`poll_${pollId}`);
      console.log(`🚪 Socket ${socket.id} left poll room: poll_${pollId}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};