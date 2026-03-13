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
  const blockers = updates.flatMap((u) => (u.blockers || []).filter((b) => !b.resolved));
  const completedTaskCount = updates.reduce((sum, u) => sum + (u.completedTasks || []).length, 0);
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
  const activeBlockers = updates.flatMap((u) => (u.blockers || []).filter((b) => !b.resolved));
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
    const incompleteMilestones = (project.milestones || []).filter((m) => !m.completed && new Date(m.dueDate) > Date.now());
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
        activeBlockers: updates.flatMap((u) => (u.blockers || []).filter((b) => !b.resolved)).length,
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

// @desc    Generate AI summary (alias endpoint)
// @route   POST /api/ai/generate-summary
// @access  Private (Professor)
const generateSummaryAlias = generateSummary;

// @desc    Detect contribution imbalance among team members
// @route   POST /api/ai/contribution-analysis
// @access  Private (Professor)
const analyzeContributions = async (req, res) => {
  try {
    const { projectId, teamId, weekNumber } = req.body;

    const query = { project: projectId };
    if (teamId) query.team = teamId;
    if (weekNumber) query.weekNumber = parseInt(weekNumber);

    const updates = await WeeklyUpdate.find(query).populate('student', 'name email');

    if (!updates.length) {
      return res.status(404).json({ success: false, message: 'No updates found for analysis' });
    }

    const studentContribs = {};
    updates.forEach((u) => {
      const sid = u.student._id.toString();
      if (!studentContribs[sid]) {
        studentContribs[sid] = { student: u.student, percentages: [], hours: [], updates: 0 };
      }
      studentContribs[sid].percentages.push(u.contributionPercentage || 0);
      studentContribs[sid].hours.push(u.hoursWorked || 0);
      studentContribs[sid].updates++;
    });

    const members = Object.values(studentContribs).map((m) => ({
      student: m.student,
      avgContribution: m.percentages.reduce((a, b) => a + b, 0) / m.percentages.length,
      totalHours: m.hours.reduce((a, b) => a + b, 0),
      updateCount: m.updates,
    }));

    const avg = members.reduce((sum, m) => sum + m.avgContribution, 0) / members.length;
    const imbalanced = members.filter((m) => m.avgContribution < avg * 0.5);

    let summaryText = `Contribution analysis for ${members.length} team member(s). `;
    summaryText += `Team average contribution: ${avg.toFixed(1)}%. `;
    if (imbalanced.length > 0) {
      summaryText += `${imbalanced.length} member(s) are contributing significantly below average: ${imbalanced.map((m) => m.student.name).join(', ')}.`;
    } else {
      summaryText += 'Contributions appear balanced across the team.';
    }

    const insight = await AIInsight.create({
      project: projectId,
      team: teamId || null,
      weekNumber: weekNumber ? parseInt(weekNumber) : undefined,
      type: 'contribution_analysis',
      summary: summaryText,
      riskLevel: imbalanced.length > 0 ? 'medium' : 'low',
      riskFactors: imbalanced.length > 0 ? [`${imbalanced.length} member(s) with low contribution`] : [],
      recommendations: imbalanced.length > 0
        ? ['Follow up with low-contributing members', 'Consider redistributing workload']
        : ['Contribution balance is healthy'],
      contributionBreakdown: members.map((m) => ({
        student: m.student._id,
        studentName: m.student.name,
        percentage: m.avgContribution,
      })),
      generatedBy: 'rule-based',
      details: { memberCount: members.length, averageContribution: avg, imbalancedCount: imbalanced.length },
    });

    res.status(201).json({ success: true, insight, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get risk prediction for a project (enhanced endpoint)
// @route   GET /api/ai/risk/:projectId
// @access  Private
const getRiskPrediction = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const updates = await WeeklyUpdate.find({ project: projectId })
      .populate('student', 'name email')
      .populate('team', 'name')
      .sort({ weekNumber: -1 });

    const weekNumber = updates.length > 0 ? updates[0].weekNumber : 1;
    const { riskLevel, riskFactors, recommendations } = assessRisk(updates, project, weekNumber);

    const teams = await Team.find({ project: projectId }).populate('members.user', 'name email');
    const totalStudents = teams.reduce((acc, t) => acc + t.members.length, 0);

    const activeStudentIds = new Set(
      updates.filter(u => u.weekNumber >= weekNumber - 1).map(u => u.student?._id?.toString())
    );
    const allStudentIds = new Set(
      teams.flatMap(t => t.members.map(m => m.user._id.toString()))
    );
    const inactiveCount = [...allStudentIds].filter(id => !activeStudentIds.has(id)).length;

    const weekGroups = {};
    updates.forEach(u => {
      if (!weekGroups[u.weekNumber]) weekGroups[u.weekNumber] = 0;
      weekGroups[u.weekNumber]++;
    });
    const recentWeeks = Object.keys(weekGroups).sort((a, b) => Number(b) - Number(a)).slice(0, 4);
    const isDeclining = recentWeeks.length >= 2 &&
      weekGroups[recentWeeks[0]] < weekGroups[recentWeeks[recentWeeks.length - 1]];

    const signals = {
      totalStudents,
      activeStudentsThisWeek: activeStudentIds.size,
      inactiveMembers: inactiveCount,
      participationRate: totalStudents > 0 ? (activeStudentIds.size / totalStudents) * 100 : 0,
      avgHoursThisWeek: updates.filter(u => u.weekNumber === weekNumber)
        .reduce((sum, u) => sum + (u.hoursWorked || 0), 0) / Math.max(1, updates.filter(u => u.weekNumber === weekNumber).length),
      isParticipationDeclining: isDeclining,
      weekNumber,
    };

    res.json({
      success: true,
      projectId,
      riskLevel,
      riskFactors,
      recommendations,
      signals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Academic integrity analysis - detect suspicious patterns
// @route   GET /api/ai/integrity/:projectId
// @access  Private (Professor)
const analyzeIntegrity = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const updates = await WeeklyUpdate.find({ project: projectId })
      .populate('student', 'name email')
      .populate('team', 'name')
      .sort({ weekNumber: 1, createdAt: 1 });

    const teams = await Team.find({ project: projectId }).populate('members.user', 'name email');
    const totalStudents = teams.reduce((acc, t) => acc + t.members.length, 0);

    const flags = [];
    const studentStats = {};

    updates.forEach(u => {
      const sid = u.student?._id?.toString();
      if (!sid) return;
      if (!studentStats[sid]) {
        studentStats[sid] = {
          name: u.student.name,
          updates: [],
          contributions: [],
          hours: [],
          weekNumbers: [],
        };
      }
      studentStats[sid].updates.push(u);
      studentStats[sid].contributions.push(u.contributionPercentage || 0);
      studentStats[sid].hours.push(u.hoursWorked || 0);
      studentStats[sid].weekNumbers.push(u.weekNumber);
    });

    // Flag 1: Identical/near-identical update text
    const updatesByWeek = {};
    updates.forEach(u => {
      if (!updatesByWeek[u.weekNumber]) updatesByWeek[u.weekNumber] = [];
      updatesByWeek[u.weekNumber].push(u);
    });

    Object.entries(updatesByWeek).forEach(([week, weekUpdates]) => {
      const contributions = weekUpdates
        .map(u => u.individualContribution?.toLowerCase().trim())
        .filter(Boolean);

      for (let i = 0; i < contributions.length; i++) {
        for (let j = i + 1; j < contributions.length; j++) {
          const similarity = stringSimilarity(contributions[i], contributions[j]);
          if (similarity > 0.85) {
            flags.push({
              type: 'identical_updates',
              severity: 'high',
              week: Number(week),
              description: `Week ${week}: Two students submitted very similar update descriptions (${(similarity * 100).toFixed(0)}% similar)`,
              students: [weekUpdates[i].student?.name, weekUpdates[j].student?.name],
            });
          }
        }
      }
    });

    // Flag 2: Contribution imbalance / last-minute spikes
    const allStudentIds = new Set(
      teams.flatMap(t => t.members.map(m => m.user._id.toString()))
    );
    const weekNumbers = updates.map(u => u.weekNumber);
    const totalWeeks = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 0;

    Object.entries(studentStats).forEach(([sid, stat]) => {
      const avgContrib = stat.contributions.reduce((a, b) => a + b, 0) / Math.max(1, stat.contributions.length);
      const avgHours = stat.hours.reduce((a, b) => a + b, 0) / Math.max(1, stat.hours.length);

      if (avgContrib < 10 && stat.updates.length > 2) {
        flags.push({
          type: 'contribution_imbalance',
          severity: 'medium',
          description: `${stat.name} has an average contribution of only ${avgContrib.toFixed(1)}% across ${stat.updates.length} submissions`,
          student: stat.name,
        });
      }

      if (totalWeeks >= 4) {
        const earlyWeekHours = stat.hours.slice(0, -2).reduce((a, b) => a + b, 0) / Math.max(1, stat.hours.slice(0, -2).length);
        const lastWeekHours = stat.hours.slice(-2).reduce((a, b) => a + b, 0) / 2;
        if (earlyWeekHours < 3 && lastWeekHours > earlyWeekHours * 3 && lastWeekHours > 10) {
          flags.push({
            type: 'last_minute_spike',
            severity: 'medium',
            description: `${stat.name} shows a last-minute activity spike: avg ${earlyWeekHours.toFixed(1)}h/week early on, then ${lastWeekHours.toFixed(1)}h/week recently`,
            student: stat.name,
          });
        }
      }
    });

    // Flag 3: Inactive members
    allStudentIds.forEach(sid => {
      if (studentStats[sid]) {
        const submittedWeeks = studentStats[sid].weekNumbers.length;
        if (totalWeeks >= 3 && submittedWeeks < totalWeeks * 0.5) {
          flags.push({
            type: 'inactive_member',
            severity: 'high',
            description: `${studentStats[sid].name} only submitted ${submittedWeeks}/${totalWeeks} weekly updates`,
            student: studentStats[sid].name,
          });
        }
      } else if (totalWeeks >= 2) {
        const teamMember = teams.flatMap(t => t.members).find(m => m.user._id.toString() === sid);
        if (teamMember) {
          flags.push({
            type: 'no_updates',
            severity: 'critical',
            description: `${teamMember.user.name} has submitted 0 weekly updates across ${totalWeeks} weeks`,
            student: teamMember.user.name,
          });
        }
      }
    });

    const criticalFlags = flags.filter(f => f.severity === 'critical').length;
    const highFlags = flags.filter(f => f.severity === 'high').length;
    const mediumFlags = flags.filter(f => f.severity === 'medium').length;

    let integrityScore = 100 - (criticalFlags * 25 + highFlags * 15 + mediumFlags * 8);
    integrityScore = Math.max(0, integrityScore);

    let integrityLevel;
    if (integrityScore >= 85) integrityLevel = 'clean';
    else if (integrityScore >= 65) integrityLevel = 'minor_concerns';
    else if (integrityScore >= 40) integrityLevel = 'suspicious';
    else integrityLevel = 'high_risk';

    res.json({
      success: true,
      projectId,
      integrityScore,
      integrityLevel,
      flags,
      summary: flags.length === 0
        ? 'No suspicious patterns detected. All contributions appear authentic.'
        : `Detected ${flags.length} integrity flag(s) requiring review.`,
      stats: {
        totalStudents,
        totalUpdates: updates.length,
        totalWeeks,
        flagCounts: { critical: criticalFlags, high: highFlags, medium: mediumFlags },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Simple string similarity (Jaccard on words).
 */
const stringSimilarity = (a, b) => {
  if (!a || !b) return 0;
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

module.exports = { generateSummary, generateSummaryAlias, getInsights, getLatestInsight, analyzeContributions, getRiskPrediction, analyzeIntegrity };
