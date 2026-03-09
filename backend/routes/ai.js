const express = require('express');
const router = express.Router();
const { generateSummary, getInsights, getLatestInsight } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/summary', authorize('professor'), generateSummary);
router.get('/insights/:projectId', getInsights);
router.get('/insights/:projectId/latest', getLatestInsight);

module.exports = router;
