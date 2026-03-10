const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    industryProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IndustryProject',
      required: true,
    },
    applicantTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    applicantStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverLetter: {
      type: String,
      maxlength: [3000, 'Cover letter cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'accepted', 'rejected'],
      default: 'pending',
    },
    reviewNotes: { type: String },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// One application per student per industry project
ApplicationSchema.index({ industryProject: 1, applicantStudent: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
