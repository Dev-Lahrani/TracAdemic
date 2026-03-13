const express = require('express');
const router = express.Router();
const { generateSummary, generateSummaryAlias, getInsights, getLatestInsight, analyzeContributions, getRiskPrediction, analyzeIntegrity } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/summary', authorize('professor'), generateSummary);
router.post('/generate-summary', authorize('professor'), generateSummaryAlias);
router.post('/contribution-analysis', authorize('professor'), analyzeContributions);
router.get('/insights/:projectId', getInsights);
router.get('/insights/:projectId/latest', getLatestInsight);
router.get('/risk/:projectId', getRiskPrediction);
router.get('/integrity/:projectId', authorize('professor'), analyzeIntegrity);

module.exports = router;
