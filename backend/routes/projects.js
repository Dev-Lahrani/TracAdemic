const express = require('express');
const router = express.Router();
const {
  createProject,
  getProfessorProjects,
  getStudentProjects,
  getProject,
  updateProject,
  joinProject,
  getProjectProgress,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student', authorize('student'), getStudentProjects);
router.post('/join', authorize('student'), joinProject);
router.get('/', authorize('professor'), getProfessorProjects);
router.post('/', authorize('professor'), createProject);
router.get('/:id', getProject);
router.put('/:id', authorize('professor'), updateProject);
router.get('/:id/progress', getProjectProgress);

module.exports = router;
