const Poll = require('../models/Poll');
const User = require('../models/User');
const Vote = require('../models/Vote');
const RealTimeService = require('../utils/realTimeService');

// Get system statistics
exports.getSystemStats = async (req, res) => {
  try {
    const totalPolls = await Poll.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalVotes = await Vote.countDocuments();
    const activePolls = await Poll.countDocuments({ 
      isActive: true, 
      isClosed: false,
      $or: [
        { closesAt: { $exists: false } },
        { closesAt: { $gt: new Date() } }
      ]
    });

    const recentPolls = await Poll.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'username');

    const stats = {
      totalPolls,
      totalUsers,
      totalVotes,
      activePolls,
      recentPolls,
      realtime: RealTimeService.getRealtimeStats(),
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching system statistics',
      error: error.message
    });
  }
};

// Get admin statistics
exports.getAdminStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access admin statistics'
      });
    }

    // Advanced statistics for admin
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const pollsToday = await Poll.countDocuments({
      createdAt: { $gte: yesterday }
    });

    const votesToday = await Vote.countDocuments({
      votedAt: { $gte: yesterday }
    });

    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: yesterday }
    });

    const topPolls = await Poll.find({ isActive: true })
      .sort({ totalVotes: -1 })
      .limit(10)
      .populate('createdBy', 'username');

    const adminStats = {
      pollsToday,
      votesToday,
      newUsersToday,
      topPolls,
      realtime: RealTimeService.getRealtimeStats(),
      timestamp: new Date().toISOString()
    };

    // Emit real-time update to all admins
    RealTimeService.emitAdminStats(adminStats);

    res.status(200).json({
      status: 'success',
      data: { stats: adminStats }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching admin statistics',
      error: error.message
    });
  }
};