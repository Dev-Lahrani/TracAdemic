const express = require('express');
const router = express.Router();
const { getProjectTeams, getTeam, createTeam, inviteMember, removeMember, assignLeader, getTeamAnalytics } = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/project/:projectId', getProjectTeams);
router.post('/', authorize('professor'), createTeam);
router.get('/:id', getTeam);
router.get('/:id/analytics', getTeamAnalytics);
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/leader', authorize('professor'), assignLeader);

module.exports = router;
