const Project = require('../models/Project');
const Team = require('../models/Team');
const WeeklyUpdate = require('../models/WeeklyUpdate');
const AIInsight = require('../models/AIInsight');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Professor only)
const createProject = async (req, res) => {
  try {
    const { title, description, course, semester, startDate, endDate, milestones, tags } = req.body;

    const project = await Project.create({
      title,
      description,
      course,
      semester,
      startDate,
      endDate,
      milestones: milestones || [],
      tags: tags || [],
      professor: req.user.id,
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all projects for professor
// @route   GET /api/projects
// @access  Private (Professor)
const getProfessorProjects = async (req, res) => {
  try {
    const projects = await Project.find({ professor: req.user.id }).sort({ createdAt: -1 });

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const teams = await Team.find({ project: project._id }).populate('members.user', 'name email');
        const totalStudents = teams.reduce((acc, team) => acc + team.members.length, 0);
        const recentUpdates = await WeeklyUpdate.countDocuments({ project: project._id });
        return {
          ...project.toObject(),
          teamCount: teams.length,
          studentCount: totalStudents,
          updateCount: recentUpdates,
        };
      })
    );

    res.json({ success: true, projects: projectsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get projects for a student
// @route   GET /api/projects/student
// @access  Private (Student)
const getStudentProjects = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user.id }).populate('project');
    const projects = teams
      .filter((t) => t.project)
      .map((team) => ({
        ...team.project.toObject(),
        teamId: team._id,
        teamName: team.name,
        memberRole: team.members.find((m) => m.user.toString() === req.user.id.toString())?.role,
      }));

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single project with full details
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('professor', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check authorization
    if (req.user.role === 'professor' && project.professor._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
    }

    const teams = await Team.find({ project: project._id }).populate('members.user', 'name email department');

    if (req.user.role === 'student') {
      const isMember = teams.some((team) =>
        team.members.some((m) => m.user._id.toString() === req.user.id)
      );
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
      }
    }

    res.json({ success: true, project: { ...project.toObject(), teams } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Professor only)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.professor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, project: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join a project by invite code
// @route   POST /api/projects/join
// @access  Private (Student)
const joinProject = async (req, res) => {
  try {
    const { inviteCode, teamName } = req.body;

    const project = await Project.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    // Check if student is already in a team for this project
    const existingTeam = await Team.findOne({
      project: project._id,
      'members.user': req.user.id,
    });

    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'You are already a member of this project' });
    }

    // Find existing team by name or create new one
    let team = await Team.findOne({ project: project._id, name: teamName });

    if (!team) {
      team = await Team.create({
        project: project._id,
        name: teamName || `Team ${Date.now()}`,
        members: [{ user: req.user.id, role: 'leader' }],
      });
    } else {
      team.members.push({ user: req.user.id, role: 'member' });
      await team.save();
    }

    res.status(200).json({ success: true, message: 'Successfully joined project', project, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get project progress overview
// @route   GET /api/projects/:id/progress
// @access  Private
const getProjectProgress = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const teams = await Team.find({ project: project._id }).populate('members.user', 'name email');
    const allUpdates = await WeeklyUpdate.find({ project: project._id })
      .populate('student', 'name email')
      .sort({ weekNumber: 1, createdAt: -1 });

    // Calculate progress metrics
    const totalWeeks = Math.ceil(
      (new Date(project.endDate) - new Date(project.startDate)) / (7 * 24 * 60 * 60 * 1000)
    );
    const currentWeek = Math.ceil(
      (Date.now() - new Date(project.startDate)) / (7 * 24 * 60 * 60 * 1000)
    );

    const weeklyStats = {};
    allUpdates.forEach((update) => {
      if (!weeklyStats[update.weekNumber]) {
        weeklyStats[update.weekNumber] = { updates: 0, blockers: 0, totalHours: 0 };
      }
      weeklyStats[update.weekNumber].updates++;
      weeklyStats[update.weekNumber].blockers += update.blockers.filter((b) => !b.resolved).length;
      weeklyStats[update.weekNumber].totalHours += update.hoursWorked || 0;
    });

    res.json({
      success: true,
      progress: {
        project,
        teams,
        totalWeeks,
        currentWeek: Math.max(1, currentWeek),
        weeklyStats,
        recentUpdates: allUpdates.slice(0, 10),
        completedMilestones: project.milestones.filter((m) => m.completed).length,
        totalMilestones: project.milestones.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  getProfessorProjects,
  getStudentProjects,
  getProject,
  updateProject,
  joinProject,
  getProjectProgress,
};
