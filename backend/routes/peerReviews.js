const express = require('express');
const router = express.Router();
const {
  createReview,
  getProjectReviews,
  getMyReviews,
} = require('../controllers/peerReviewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', protect, createReview);
router.get('/project/:projectId', getProjectReviews);
router.get('/my-reviews/:projectId', getMyReviews);

module.exports = router;
