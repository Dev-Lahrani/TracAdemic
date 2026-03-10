const Evaluation = require('../models/Evaluation');
const WeeklyUpdate = require('../models/WeeklyUpdate');
const Team = require('../models/Team');

// Grading formula weights
const GRADING_WEIGHTS = {
  contribution: 0.40,
  submission: 0.30,
  mood: 0.20,
};
const MAX_SUBMISSION_POINTS = 30;
const POINTS_PER_SUBMISSION = 10;
const MOOD_SCORES = { great: 100, good: 80, okay: 60, struggling: 40 };

// @desc    Create or update an evaluation
// @route   POST /api/evaluations
// @access  Private (Professor)
const createEvaluation = async (req, res) => {
  try {
    const {
      projectId, evaluationType, studentId, teamId,
      marks, maxMarks, breakdown, comments,
    } = req.body;

    if (evaluationType === 'individual' && !studentId) {
      return res.status(400).json({ success: false, message: 'studentId required for individual evaluation' });
    }
    if (evaluationType === 'team' && !teamId) {
      return res.status(400).json({ success: false, message: 'teamId required for team evaluation' });
    }

    const evalData = {
      project: projectId,
      evaluatedBy: req.user.id,
      evaluationType,
      marks,
      maxMarks: maxMarks || 100,
      breakdown,
      comments,
    };
    if (evaluationType === 'individual') evalData.student = studentId;
    if (evaluationType === 'team') evalData.team = teamId;

    // Upsert
    const filter = { project: projectId };
    if (evaluationType === 'individual') filter.student = studentId;
    if (evaluationType === 'team') { filter.team = teamId; filter.evaluationType = 'team'; }

    const evaluation = await Evaluation.findOneAndUpdate(
      filter,
      evalData,
      { new: true, upsert: true, runValidators: true }
    );

    if (evaluation) {
      await evaluation.populate('student', 'name email');
      await evaluation.populate('team', 'name');
      await evaluation.populate('evaluatedBy', 'name email');
    }

    res.status(201).json({ success: true, evaluation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get evaluations for a project
// @route   GET /api/evaluations/project/:projectId
// @access  Private
const getProjectEvaluations = async (req, res) => {
  try {
    const query = { project: req.params.projectId };
    if (req.query.evaluationType) query.evaluationType = req.query.evaluationType;
    if (req.query.studentId) query.student = req.query.studentId;
    if (req.query.teamId) query.team = req.query.teamId;

    const evaluations = await Evaluation.find(query)
      .populate('student', 'name email')
      .populate('team', 'name')
      .populate('evaluatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, evaluations, count: evaluations.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI-suggested marks for a student based on their contributions
// @route   GET /api/evaluations/suggest/:projectId/:studentId
// @access  Private (Professor)
const getSuggestedMarks = async (req, res) => {
  try {
    const { projectId, studentId } = req.params;

    const updates = await WeeklyUpdate.find({ project: projectId, student: studentId });
    if (!updates.length) {
      return res.status(404).json({ success: false, message: 'No updates found for this student' });
    }

    const totalHours = updates.reduce((sum, u) => sum + (u.hoursWorked || 0), 0);
    const avgContribution = updates.reduce((sum, u) => sum + (u.contributionPercentage || 0), 0) / updates.length;
    const submissionRate = updates.length;
    const avgMoodScore = updates.reduce((sum, u) => sum + (MOOD_SCORES[u.mood] || 60), 0) / updates.length;

    // Weighted grading formula
    const submissionScore = Math.min(submissionRate * POINTS_PER_SUBMISSION, MAX_SUBMISSION_POINTS);
    const suggestedMarks = Math.min(
      100,
      Math.round(
        avgContribution * GRADING_WEIGHTS.contribution +
        submissionScore * (GRADING_WEIGHTS.submission / (MAX_SUBMISSION_POINTS / 100)) +
        avgMoodScore * GRADING_WEIGHTS.mood
      )
    );

    const reasoning = [
      `Average contribution: ${avgContribution.toFixed(1)}% across ${updates.length} submissions`,
      `Total hours logged: ${totalHours}`,
      `Submission score: ${submissionScore.toFixed(0)}/${MAX_SUBMISSION_POINTS} points`,
      `Team morale score: ${avgMoodScore.toFixed(0)}/100`,
    ].join('. ');

    res.json({
      success: true,
      suggestion: {
        studentId,
        projectId,
        suggestedMarks,
        maxMarks: 100,
        reasoning,
        basedOnUpdates: updates.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createEvaluation, getProjectEvaluations, getSuggestedMarks };
