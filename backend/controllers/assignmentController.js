const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// @desc    Get AI-suggested task assignments
// @route   POST /api/assignments/suggest
// @access  Private
const suggestAssignments = async (req, res) => {
  try {
    const { projectId, tasks, teamMembers } = req.body;

    if (!tasks || !teamMembers) {
      return res.status(400).json({ success: false, message: 'Tasks and team members required' });
    }

    const assignments = await generateSmartAssignments(tasks, teamMembers, projectId);

    res.json({
      success: true,
      assignments,
      confidence: calculateConfidence(assignments),
      methodology: explainAssignments(assignments),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Analyze workload distribution
// @route   POST /api/assignments/workload
// @access  Private
const analyzeWorkload = async (req, res) => {
  try {
    const { projectId, teamMembers } = req.body;

    const workload = await calculateWorkloadDistribution(teamMembers, projectId);

    res.json({
      success: true,
      workload,
      recommendations: generateWorkloadRecommendations(workload),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Predict task completion time
// @route   POST /api/assignments/predict-time
// @access  Private
const predictCompletionTime = async (req, res) => {
  try {
    const { taskId, memberId, taskComplexity } = req.body;

    const predictedHours = predictHours(taskId, memberId, taskComplexity);

    res.json({
      success: true,
      prediction: {
        hours: predictedHours,
        range: `${Math.round(predictedHours * 0.8)}-${Math.round(predictedHours * 1.2)} hours`,
        confidence: 0.75,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Smart assignment algorithm
async function generateSmartAssignments(tasks, teamMembers, projectId) {
  const assignments = [];
  const memberWorkloads = {};
  const memberSkills = {};

  // Initialize workloads and skill profiles
  teamMembers.forEach(member => {
    memberWorkloads[member.id] = member.currentWorkload || 0;
    memberSkills[member.id] = {
      technical: member.skills?.technical || [],
      soft: member.skills?.soft || [],
      availability: member.availability || 5,
      performance: member.averagePerformance || 70,
    };
  });

  // Sort tasks by priority and complexity
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.complexity - a.complexity;
  });

  // Assign tasks optimally
  sortedTasks.forEach(task => {
    let bestMember = null;
    let bestScore = -1;

    teamMembers.forEach(member => {
      const score = calculateAssignmentScore(
        task,
        member,
        memberWorkloads[member.id],
        memberSkills[member.id]
      );

      if (score > bestScore) {
        bestScore = score;
        bestMember = member;
      }
    });

    if (bestMember) {
      assignments.push({
        taskId: task.id,
        taskName: task.name,
        assigneeId: bestMember.id,
        assigneeName: bestMember.name,
        predictedHours: predictHours(task.id, bestMember.id, task.complexity),
        score: bestScore,
        reasoning: getAssignmentReasoning(task, bestMember, bestScore),
      });

      // Update workload
      memberWorkloads[bestMember.id] += task.complexity || 1;
    }
  });

  return assignments;
}

function calculateAssignmentScore(task, member, workload, skills) {
  let score = 0;

  // Skill match (40% weight)
  const skillMatch = calculateSkillMatch(task.requiredSkills || [], skills.technical);
  score += skillMatch * 40;

  // Workload balance (25% weight)
  const workloadScore = Math.max(0, 100 - workload * 5);
  score += workloadScore * 0.25;

  // Availability (20% weight)
  score += (skills.availability / 5) * 20;

  // Past performance (15% weight)
  score += skills.performance * 0.15;

  return score;
}

function calculateSkillMatch(requiredSkills, memberSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!memberSkills || memberSkills.length === 0) return 0;

  const matched = requiredSkills.filter(skill =>
    memberSkills.some(ms => ms.toLowerCase().includes(skill.toLowerCase()))
  ).length;

  return Math.round((matched / requiredSkills.length) * 100);
}

function predictHours(taskId, memberId, complexity) {
  const baseHours = 2;
  const complexityMultiplier = complexity || 1;
  const performanceFactor = 1.1; // Average performance

  return Math.round(baseHours * complexityMultiplier * performanceFactor);
}

function getAssignmentReasoning(task, member, score) {
  const reasons = [];

  if (score > 80) {
    reasons.push('Perfect skill match');
  } else if (score > 60) {
    reasons.push('Good skill match');
  }

  if ((member.currentWorkload || 0) < 10) {
    reasons.push('Available capacity');
  }

  return reasons.join(', ');
}

function calculateConfidence(assignments) {
  const avgScore = assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length;
  return Math.min(100, Math.round(avgScore));
}

function explainAssignments(assignments) {
  return {
    method: 'Skill-Weighted Greedy Algorithm',
    factors: ['Skill Match', 'Workload Balance', 'Availability', 'Past Performance'],
    constraints: ['Team capacity limits', 'Task dependencies'],
  };
}

async function calculateWorkloadDistribution(teamMembers, projectId) {
  return teamMembers.map(member => ({
    memberId: member.id,
    name: member.name,
    currentLoad: member.currentWorkload || 0,
    capacity: member.capacity || 40, // hours per week
    utilization: Math.round(((member.currentWorkload || 0) / (member.capacity || 40)) * 100),
    status: getWorkloadStatus(member.currentWorkload || 0, member.capacity || 40),
  }));
}

function getWorkloadStatus(current, capacity) {
  const utilization = current / capacity;
  if (utilization > 0.9) return 'overloaded';
  if (utilization > 0.7) return 'busy';
  if (utilization > 0.4) return 'moderate';
  return 'light';
}

function generateWorkloadRecommendations(workload) {
  const recommendations = [];

  const overloaded = workload.filter(w => w.status === 'overloaded');
  const underutilized = workload.filter(w => w.status === 'light');

  if (overloaded.length > 0) {
    overloaded.forEach(w => {
      recommendations.push({
        type: 'reallocate',
        message: `Reassign tasks from ${w.name} to balance workload`,
        priority: 'high',
      });
    });
  }

  if (underutilized.length > 0 && overloaded.length > 0) {
    recommendations.push({
      type: 'balance',
      message: `Transfer tasks from ${overloaded.map(o => o.name).join(', ')} to ${underutilized.map(u => u.name).join(', ')}`,
      priority: 'medium',
    });
  }

  return recommendations;
}

module.exports = {
  suggestAssignments,
  analyzeWorkload,
  predictCompletionTime,
};

// Export route handlers
const suggestAssignmentsHandler = async (req, res) => {
  try {
    const { projectId, tasks, teamMembers } = req.body;

    if (!tasks || !teamMembers) {
      return res.status(400).json({ success: false, message: 'Tasks and team members required' });
    }

    const assignments = await generateSmartAssignments(tasks, teamMembers, projectId);

    res.json({
      success: true,
      assignments,
      confidence: calculateConfidence(assignments),
      methodology: explainAssignments(assignments),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const analyzeWorkloadHandler = async (req, res) => {
  try {
    const { projectId, teamMembers } = req.body;
    const workload = await calculateWorkloadDistribution(teamMembers, projectId);

    res.json({
      success: true,
      workload,
      recommendations: generateWorkloadRecommendations(workload),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const predictCompletionTimeHandler = async (req, res) => {
  try {
    const { taskId, memberId, taskComplexity } = req.body;
    const predictedHours = predictHours(taskId, memberId, taskComplexity);

    res.json({
      success: true,
      prediction: {
        hours: predictedHours,
        range: `${Math.round(predictedHours * 0.8)}-${Math.round(predictedHours * 1.2)} hours`,
        confidence: 0.75,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
