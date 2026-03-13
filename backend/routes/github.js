const express = require('express');
const router = express.Router();
const { analyzeGitHubContribution } = require('../controllers/githubController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/github/contribution/:studentId
router.get('/contribution/:studentId', analyzeGitHubContribution);

module.exports = router;
