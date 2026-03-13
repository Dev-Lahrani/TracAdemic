const WeeklyUpdate = require('../models/WeeklyUpdate');
const Team = require('../models/Team');
const Project = require('../models/Project');

// @desc    Submit a weekly update
// @route   POST /api/updates
// @access  Private (Student)
const submitUpdate = async (req, res) => {
  try {
    const {
      projectId,
      teamId,
      weekNumber,
      weekStartDate,
      completedTasks,
      plannedTasks,
      blockers,
      individualContribution,
      contributionPercentage,
      mood,
      hoursWorked,
    } = req.body;

    // Validate team membership
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const isMember = team.members.some((m) => m.user.toString() === req.user.id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this team' });
    }

    // Check if update already exists for this week
    const existing = await WeeklyUpdate.findOne({
      project: projectId,
      student: req.user.id,
      weekNumber,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an update for this week. Use PUT to update it.',
        updateId: existing._id,
      });
    }

    const update = await WeeklyUpdate.create({
      project: projectId,
      team: teamId,
      student: req.user.id,
      weekNumber,
      weekStartDate,
      completedTasks: completedTasks || [],
      plannedTasks: plannedTasks || [],
      blockers: blockers || [],
      individualContribution,
      contributionPercentage,
      mood,
      hoursWorked: hoursWorked || 0,
    });

    await update.populate('student', 'name email');

    res.status(201).json({ success: true, update });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Update already submitted for this week' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a weekly update
// @route   PUT /api/updates/:id
// @access  Private (Student)
const editUpdate = async (req, res) => {
  try {
    const update = await WeeklyUpdate.findById(req.params.id);
    if (!update) return res.status(404).json({ success: false, message: 'Update not found' });

    if (update.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this update' });
    }

    const allowedFields = [
      'completedTasks', 'plannedTasks', 'blockers', 'individualContribution',
      'contributionPercentage', 'mood', 'hoursWorked',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    await update.save();
    await update.populate('student', 'name email');
    res.json({ success: true, update });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get updates for a project (professor view)
// @route   GET /api/updates/project/:projectId
// @access  Private
const getProjectUpdates = async (req, res) => {
  try {
    const { weekNumber, teamId, page, limit } = req.query;
    const query = { project: req.params.projectId };

    if (weekNumber) query.weekNumber = parseInt(weekNumber);
    if (teamId) query.team = teamId;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await WeeklyUpdate.countDocuments(query);
    const updates = await WeeklyUpdate.find(query)
      .populate('student', 'name email department')
      .populate('team', 'name')
      .sort({ weekNumber: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      updates,
      count: updates.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a student's own updates for a project
// @route   GET /api/updates/my/:projectId
// @access  Private (Student)
const getMyUpdates = async (req, res) => {
  try {
    const updates = await WeeklyUpdate.find({
      project: req.params.projectId,
      student: req.user.id,
    }).sort({ weekNumber: -1 });

    res.json({ success: true, updates, count: updates.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single update
// @route   GET /api/updates/:id
// @access  Private
const getUpdate = async (req, res) => {
  try {
    const update = await WeeklyUpdate.findById(req.params.id)
      .populate('student', 'name email')
      .populate('team', 'name');

    if (!update) return res.status(404).json({ success: false, message: 'Update not found' });
    res.json({ success: true, update });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitUpdate, editUpdate, getProjectUpdates, getMyUpdates, getUpdate };
