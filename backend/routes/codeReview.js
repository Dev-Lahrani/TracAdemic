const express = require('express');
const router = express.Router();
const {
  reviewCode,
  reviewPullRequest,
  checkCodeQuality,
  suggestImprovements,
} = require('../controllers/codeReviewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/review', reviewCode);
router.post('/pull-request/:prId', reviewPullRequest);
router.post('/quality/:projectId', checkCodeQuality);
router.post('/improvements/:projectId', suggestImprovements);

module.exports = router;
