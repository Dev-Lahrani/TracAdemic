const express = require('express');
const router = express.Router();
const { createEvaluation, getProjectEvaluations, getSuggestedMarks } = require('../controllers/evaluationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('professor'), createEvaluation);
router.get('/project/:projectId', getProjectEvaluations);
router.get('/suggest/:projectId/:studentId', authorize('professor'), getSuggestedMarks);

module.exports = router;
