const express = require('express');
const router = express.Router();
const { generateSummary, generateSummaryAlias, getInsights, getLatestInsight, analyzeContributions } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/summary', authorize('professor'), generateSummary);
router.post('/generate-summary', authorize('professor'), generateSummaryAlias);
router.post('/contribution-analysis', authorize('professor'), analyzeContributions);
router.get('/insights/:projectId', getInsights);
router.get('/insights/:projectId/latest', getLatestInsight);

module.exports = router;
