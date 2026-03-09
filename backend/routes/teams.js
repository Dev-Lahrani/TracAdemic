const express = require('express');
const router = express.Router();
const { getProjectTeams, getTeam, getTeamAnalytics } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/project/:projectId', getProjectTeams);
router.get('/:id', getTeam);
router.get('/:id/analytics', getTeamAnalytics);

module.exports = router;
