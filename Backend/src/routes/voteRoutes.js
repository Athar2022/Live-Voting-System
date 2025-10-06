const express = require('express');
const { body } = require('express-validator');
const {
  submitVote,
  getVoteResults,
  getUserVotes,
  checkUserVote,
  withdrawVote
} = require('../controllers/voteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules for voting
const validateVote = [
  body('pollId')
    .isMongoId()
    .withMessage('Valid poll ID is required'),
  body('selectedOptions')
    .isArray({ min: 1 })
    .withMessage('At least one option must be selected'),
  body('selectedOptions.*')
    .isInt({ min: 0 })
    .withMessage('Option indices must be non-negative integers')
];

// All routes are protected
router.use(protect);

// Vote routes
router.post('/', validateVote, submitVote);
router.get('/my-votes', getUserVotes);
router.get('/results/:pollId', getVoteResults);
router.get('/check/:pollId', checkUserVote);
router.delete('/:pollId', withdrawVote);

module.exports = router;