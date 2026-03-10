const express = require('express');
const router = express.Router();
const {
  createIndustryProject,
  listIndustryProjects,
  getIndustryProject,
  applyToIndustryProject,
  reviewApplication,
  getApplicantTeamProfile,
} = require('../controllers/industryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('professor'), createIndustryProject);
router.get('/', listIndustryProjects);
router.get('/:id', getIndustryProject);
router.post('/:id/apply', authorize('student'), applyToIndustryProject);
router.put('/applications/:id/review', authorize('professor'), reviewApplication);
router.get('/applications/:id/team-profile', authorize('professor'), getApplicantTeamProfile);

module.exports = router;
