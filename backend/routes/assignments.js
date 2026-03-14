const express = require('express');
const router = express.Router();
const {
  suggestAssignments,
  analyzeWorkload,
  predictCompletionTime,
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/suggest', suggestAssignments);
router.post('/workload', analyzeWorkload);
router.post('/predict-time', predictCompletionTime);

module.exports = router;
