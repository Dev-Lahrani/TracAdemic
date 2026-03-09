const mongoose = require('mongoose');

const WeeklyUpdateSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    completedTasks: [
      {
        title: { type: String, required: true },
        description: { type: String },
        hoursSpent: { type: Number, default: 0 },
      },
    ],
    plannedTasks: [
      {
        title: { type: String, required: true },
        description: { type: String },
      },
    ],
    blockers: [
      {
        description: { type: String, required: true },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
        resolved: { type: Boolean, default: false },
      },
    ],
    individualContribution: {
      type: String,
      required: [true, 'Individual contribution summary is required'],
      maxlength: [1000, 'Contribution summary cannot exceed 1000 characters'],
    },
    contributionPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'struggling'],
      default: 'good',
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'submitted',
    },
  },
  { timestamps: true }
);

// Compound index to ensure one update per student per week per project
WeeklyUpdateSchema.index({ project: 1, student: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyUpdate', WeeklyUpdateSchema);
