const AIInsight = require('../models/AIInsight');
const WeeklyUpdate = require('../models/WeeklyUpdate');
const Project = require('../models/Project');
const Team = require('../models/Team');
const axios = require('axios').default;

/**
 * Generate a rule-based summary when the LLM service is unavailable.
 */
const generateRuleBasedSummary = (updates, project) => {
  if (!updates.length) return 'No updates submitted this week.';

  const totalHours = updates.reduce((sum, u) => sum + (u.hoursWorked || 0), 0);
  const avgHours = (totalHours / updates.length).toFixed(1);
  const blockers = updates.flatMap((u) => u.blockers.filter((b) => !b.resolved));
  const completedTaskCount = updates.reduce((sum, u) => sum + u.completedTasks.length, 0);
  const moods = { great: 0, good: 0, okay: 0, struggling: 0 };
  updates.forEach((u) => { if (u.mood) moods[u.mood]++; });
  const dominantMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0][0];

  let summary = `This week, ${updates.length} team member(s) submitted updates. `;
  summary += `The team collectively completed ${completedTaskCount} tasks, `;
  summary += `averaging ${avgHours} hours of work per member. `;

  if (blockers.length > 0) {
    summary += `There are ${blockers.length} active blocker(s) that may require attention. `;
  } else {
    summary += `No active blockers were reported. `;
  }

  summary += `Team morale appears to be "${dominantMood}". `;

  const contributions = updates
    .map((u) => `${u.student?.name || 'A member'}: ${u.individualContribution.substring(0, 80)}`)
    .join('; ');
  summary += `Key contributions: ${contributions}.`;

  return summary;
};

/**
 * Assess project risk based on updates and project data.
 */
const assessRisk = (updates, project, weekNumber) => {
  const riskFactors = [];
  let riskLevel = 'low';

  const totalWeeks = Math.ceil(
    (new Date(project.endDate) - new Date(project.startDate)) / (7 * 24 * 60 * 60 * 1000)
  );
  const progressPercent = (weekNumber / totalWeeks) * 100;

  // Risk: low submission rate
  const teams = updates.map((u) => u.team?.toString()).filter(Boolean);
  if (updates.length === 0) {
    riskFactors.push('No updates submitted this week');
    riskLevel = 'high';
  }

  // Risk: many unresolved blockers
  const activeBlockers = updates.flatMap((u) => u.blockers.filter((b) => !b.resolved));
  if (activeBlockers.length >= 3) {
    riskFactors.push(`${activeBlockers.length} unresolved blockers reported`);
    riskLevel = riskLevel === 'high' ? 'critical' : 'high';
  } else if (activeBlockers.length > 0) {
    riskFactors.push(`${activeBlockers.length} active blocker(s)`);
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  // Risk: team members struggling
  const struggling = updates.filter((u) => u.mood === 'struggling');
  if (struggling.length > 0) {
    riskFactors.push(`${struggling.length} team member(s) reporting they are struggling`);
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  // Risk: approaching deadline
  if (progressPercent > 75) {
    const incompleteMilestones = project.milestones.filter((m) => !m.completed && new Date(m.dueDate) > Date.now());
    if (incompleteMilestones.length > 0) {
      riskFactors.push(`${incompleteMilestones.length} milestone(s) pending with >75% of project timeline elapsed`);
      if (riskLevel !== 'critical') riskLevel = 'high';
    }
  }

  if (riskFactors.length === 0) {
    riskFactors.push('Project appears on track');
  }

  const recommendations = [];
  if (riskLevel === 'high' || riskLevel === 'critical') {
    recommendations.push('Schedule an immediate team check-in meeting');
    recommendations.push('Review and help resolve active blockers');
  }
  if (struggling.length > 0) {
    recommendations.push('Reach out to struggling team members individually');
  }
  if (activeBlockers.length > 0) {
    recommendations.push('Address technical blockers promptly to maintain momentum');
  }
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring progress; team appears on track');
  }

  return { riskLevel, riskFactors, recommendations };
};

// @desc    Generate AI summary for a project week
// @route   POST /api/ai/summary
// @access  Private (Professor)
const generateSummary = async (req, res) => {
  try {
    const { projectId, weekNumber, teamId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const query = { project: projectId, weekNumber: parseInt(weekNumber) };
    if (teamId) query.team = teamId;

    const updates = await WeeklyUpdate.find(query).populate('student', 'name email').populate('team', 'name');

    if (!updates.length) {
      return res.status(404).json({ success: false, message: 'No updates found for this week' });
    }

    let summary;
    let generatedBy = 'rule-based';

    // Try to use the AI service if available
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const aiResponse = await axios.post(
        `${aiServiceUrl}/summarize`,
        { updates: updates.map((u) => u.toObject()), project: project.toObject(), weekNumber },
        { timeout: 15000 }
      );
      summary = aiResponse.data.summary;
      generatedBy = 'llm';
    } catch {
      summary = generateRuleBasedSummary(updates, project);
    }

    const { riskLevel, riskFactors, recommendations } = assessRisk(updates, project, weekNumber);

    const contributionBreakdown = updates.map((u) => ({
      student: u.student._id,
      studentName: u.student.name,
      percentage: u.contributionPercentage || 0,
      sentiment: u.mood,
    }));

    const insight = await AIInsight.create({
      project: projectId,
      team: teamId || null,
      weekNumber: parseInt(weekNumber),
      type: 'weekly_summary',
      summary,
      riskLevel,
      riskFactors,
      recommendations,
      contributionBreakdown,
      generatedBy,
      details: {
        updateCount: updates.length,
        totalHours: updates.reduce((sum, u) => sum + (u.hoursWorked || 0), 0),
        activeBlockers: updates.flatMap((u) => u.blockers.filter((b) => !b.resolved)).length,
      },
    });

    res.status(201).json({ success: true, insight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI insights for a project
// @route   GET /api/ai/insights/:projectId
// @access  Private
const getInsights = async (req, res) => {
  try {
    const { weekNumber, type } = req.query;
    const query = { project: req.params.projectId };
    if (weekNumber) query.weekNumber = parseInt(weekNumber);
    if (type) query.type = type;

    const insights = await AIInsight.find(query)
      .populate('contributionBreakdown.student', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, insights, count: insights.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get the latest insight for a project
// @route   GET /api/ai/insights/:projectId/latest
// @access  Private
const getLatestInsight = async (req, res) => {
  try {
    const insight = await AIInsight.findOne({ project: req.params.projectId })
      .sort({ createdAt: -1 })
      .populate('contributionBreakdown.student', 'name email');

    if (!insight) return res.status(404).json({ success: false, message: 'No insights found' });
    res.json({ success: true, insight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateSummary, getInsights, getLatestInsight };
