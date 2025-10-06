const express = require('express');
const { body } = require('express-validator');
const {
  createPoll,
  getPolls,
  getPoll,
  updatePoll,
  deletePoll,
  closePoll,
  getMyPolls
} = require('../controllers/pollController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules for creating/updating polls
const validatePoll = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('options')
    .isArray({ min: 2 })
    .withMessage('Poll must have at least 2 options'),
  body('options.*')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each option must be between 1 and 200 characters'),
  body('closesAt')
    .optional()
    .isISO8601()
    .withMessage('Closing date must be a valid date')
    .custom(value => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Closing date must be in the future');
      }
      return true;
    })
];

// All routes are protected
router.use(protect);

// Poll routes
router.post('/', validatePoll, createPoll);
router.get('/', getPolls);
router.get('/my-polls', getMyPolls);
router.get('/:id', getPoll);
router.put('/:id', validatePoll, updatePoll);
router.delete('/:id', deletePoll);
router.patch('/:id/close', closePoll);

// Admin only routes
router.get('/admin/all', authorize('admin'), getPolls);

module.exports = router;