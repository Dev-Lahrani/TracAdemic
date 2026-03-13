const Team = require('../models/Team');
const Project = require('../models/Project');
const WeeklyUpdate = require('../models/WeeklyUpdate');

// @desc    Get teams for a project
// @route   GET /api/teams/project/:projectId
// @access  Private
const getProjectTeams = async (req, res) => {
  try {
    const teams = await Team.find({ project: req.params.projectId }).populate(
      'members.user',
      'name email department'
    );
    res.json({ success: true, teams, count: teams.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single team
// @route   GET /api/teams/:id
// @access  Private
const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members.user', 'name email department');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a team for a project (faculty)
// @route   POST /api/teams
// @access  Private (Professor)
const createTeam = async (req, res) => {
  try {
    const { projectId, name, leaderId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.professor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this project' });
    }

    const members = [];
    if (leaderId) {
      members.push({ user: leaderId, role: 'leader' });
    }

    const team = await Team.create({ project: projectId, name, members });
    await team.populate('members.user', 'name email department');
    res.status(201).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite a member to team (group leader)
// @route   POST /api/teams/:id/invite
// @access  Private (Leader or Professor)
const inviteMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id).populate('members.user', 'name email');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    // Check permission: leader or professor
    const isLeader = team.members.some(
      (m) => m.user._id.toString() === req.user.id && m.role === 'leader'
    );
    if (!isLeader && req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Only the team leader or professor can invite members' });
    }

    // Check team size limit
    const project = await Project.findById(team.project);
    if (project && project.maxTeamSize && team.members.length >= project.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Team has reached maximum size of ${project.maxTeamSize}`,
      });
    }

    // Check if already a member
    const alreadyMember = team.members.some((m) => m.user._id.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a team member' });
    }

    team.members.push({ user: userId, role: 'member' });
    await team.save();
    await team.populate('members.user', 'name email department');
    res.json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a member from team (group leader or professor)
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Leader or Professor)
const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members.user', 'name email');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const isLeader = team.members.some(
      (m) => m.user._id.toString() === req.user.id && m.role === 'leader'
    );
    if (!isLeader && req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Only the team leader or professor can remove members' });
    }

    // Cannot remove the leader (only professor can) or self-removal by leader
    const targetMember = team.members.find((m) => m.user._id.toString() === req.params.userId);
    if (targetMember && targetMember.role === 'leader' && req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Only a professor can remove the team leader' });
    }

    // Prevent leader from accidentally removing themselves (would leave team leaderless)
    if (req.params.userId === req.user.id.toString() && isLeader && req.user.role !== 'professor') {
      return res.status(400).json({ success: false, message: 'A leader cannot remove themselves. Ask a professor to reassign leadership first.' });
    }

    team.members = team.members.filter((m) => m.user._id.toString() !== req.params.userId);
    await team.save();
    await team.populate('members.user', 'name email department');
    res.json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign a new leader (faculty only)
// @route   PUT /api/teams/:id/leader
// @access  Private (Professor)
const assignLeader = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const member = team.members.find((m) => m.user.toString() === userId);
    if (!member) return res.status(404).json({ success: false, message: 'User is not a team member' });

    // Demote current leader(s), promote new leader
    team.members.forEach((m) => {
      m.role = m.user.toString() === userId ? 'leader' : 'member';
    });

    await team.save();
    await team.populate('members.user', 'name email department');
    res.json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team contribution analytics
// @route   GET /api/teams/:id/analytics
// @access  Private
const getTeamAnalytics = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members.user', 'name email');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const updates = await WeeklyUpdate.find({ team: team._id })
      .populate('student', 'name email')
      .sort({ weekNumber: 1 });

    // Build contribution data per member
    const memberStats = {};
    team.members.forEach((m) => {
      memberStats[m.user._id.toString()] = {
        student: m.user,
        role: m.role,
        totalHours: 0,
        totalUpdates: 0,
        avgContribution: 0,
        contributions: [],
        blockerCount: 0,
        moodHistory: [],
      };
    });

    updates.forEach((update) => {
      const sid = update.student._id.toString();
      if (memberStats[sid]) {
        memberStats[sid].totalHours += update.hoursWorked || 0;
        memberStats[sid].totalUpdates++;
        memberStats[sid].contributions.push({
          week: update.weekNumber,
          percentage: update.contributionPercentage || 0,
          hours: update.hoursWorked || 0,
        });
        memberStats[sid].blockerCount += (update.blockers || []).filter((b) => !b.resolved).length;
        memberStats[sid].moodHistory.push({ week: update.weekNumber, mood: update.mood });
      }
    });

    // Calculate avg contribution
    Object.values(memberStats).forEach((stat) => {
      if (stat.contributions.length > 0) {
        stat.avgContribution =
          stat.contributions.reduce((sum, c) => sum + c.percentage, 0) / stat.contributions.length;
      }
    });

    const maxWeek = updates.length > 0 ? Math.max(...updates.map((u) => u.weekNumber)) : 0;
    const totalUpdatesExpected = team.members.length * maxWeek;

    res.json({
      success: true,
      analytics: {
        team,
        memberStats: Object.values(memberStats),
        totalUpdates: updates.length,
        submissionRate: totalUpdatesExpected > 0 ? (updates.length / totalUpdatesExpected) * 100 : 0,
        weeklyTrend: [...new Set(updates.map((u) => u.weekNumber))].map((week) => {
          const weekUpdates = updates.filter((u) => u.weekNumber === week);
          return {
            week,
            updateCount: weekUpdates.length,
            totalHours: weekUpdates.reduce((sum, u) => sum + (u.hoursWorked || 0), 0),
            blockers: weekUpdates.reduce((sum, u) => sum + (u.blockers || []).filter((b) => !b.resolved).length, 0),
          };
        }),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProjectTeams, getTeam, createTeam, inviteMember, removeMember, assignLeader, getTeamAnalytics };
