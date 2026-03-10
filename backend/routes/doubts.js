const express = require('express');
const router = express.Router();
const {
  createDoubt,
  getProjectDoubts,
  replyToDoubt,
  closeDoubt,
  scheduleMeeting,
  getProjectMeetings,
  updateMeeting,
} = require('../controllers/doubtController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Doubts
router.post('/', authorize('student'), createDoubt);
router.get('/project/:projectId', getProjectDoubts);
router.post('/:id/reply', replyToDoubt);
router.put('/:id/close', closeDoubt);

// Meetings
router.post('/meetings', authorize('professor'), scheduleMeeting);
router.get('/meetings/project/:projectId', getProjectMeetings);
router.put('/meetings/:id', authorize('professor'), updateMeeting);

module.exports = router;
