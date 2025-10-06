const express = require('express');
const { getSystemStats, getAdminStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/system', getSystemStats);
router.get('/admin', authorize('admin'), getAdminStats);

module.exports = router;