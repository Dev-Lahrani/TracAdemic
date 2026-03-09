const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: String,
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String },
        dueDate: { type: Date, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'at-risk'],
      default: 'active',
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

ProjectSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
