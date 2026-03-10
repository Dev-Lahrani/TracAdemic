const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Individual or team evaluation
    evaluationType: {
      type: String,
      enum: ['individual', 'team'],
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    // Marks out of 100
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    // Breakdown
    breakdown: {
      contributions: { type: Number, min: 0, max: 100 },
      submissions: { type: Number, min: 0, max: 100 },
      projectCompletion: { type: Number, min: 0, max: 100 },
      teamwork: { type: Number, min: 0, max: 100 },
    },
    comments: {
      type: String,
      maxlength: [2000, 'Comments cannot exceed 2000 characters'],
    },
    aiSuggested: {
      type: Boolean,
      default: false,
    },
    aiSuggestions: {
      suggestedMarks: { type: Number },
      reasoning: { type: String },
    },
  },
  { timestamps: true }
);

// Ensure one evaluation per student/team per project
EvaluationSchema.index({ project: 1, student: 1 }, { unique: true, sparse: true });
EvaluationSchema.index({ project: 1, team: 1, evaluationType: 1 }, { sparse: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);
