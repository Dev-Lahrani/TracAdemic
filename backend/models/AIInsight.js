const mongoose = require('mongoose');

const AIInsightSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    weekNumber: {
      type: Number,
    },
    type: {
      type: String,
      enum: ['weekly_summary', 'contribution_analysis', 'risk_alert', 'milestone_forecast', 'team_insight'],
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    riskFactors: [{ type: String }],
    recommendations: [{ type: String }],
    contributionBreakdown: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        studentName: { type: String },
        percentage: { type: Number },
        sentiment: { type: String },
      },
    ],
    generatedBy: {
      type: String,
      enum: ['llm', 'rule-based', 'mock'],
      default: 'mock',
    },
    model: {
      type: String,
      default: 'trackacademic-analyzer',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIInsight', AIInsightSchema);
