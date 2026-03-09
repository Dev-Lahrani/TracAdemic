const express = require('express');
const router = express.Router();
const {
  submitUpdate,
  editUpdate,
  getProjectUpdates,
  getMyUpdates,
  getUpdate,
} = require('../controllers/updateController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('student'), submitUpdate);
router.get('/project/:projectId', getProjectUpdates);
router.get('/my/:projectId', authorize('student'), getMyUpdates);
router.get('/:id', getUpdate);
router.put('/:id', authorize('student'), editUpdate);

module.exports = router;
