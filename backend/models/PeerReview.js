const mongoose = require('mongoose');

const PeerReviewSchema = new mongoose.Schema(
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
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    strengths: {
      type: String,
      maxlength: [2000, 'Strengths cannot exceed 2000 characters'],
    },
    improvements: {
      type: String,
      maxlength: [2000, 'Improvements cannot exceed 2000 characters'],
    },
    comments: {
      type: String,
      maxlength: [2000, 'Comments cannot exceed 2000 characters'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PeerReview', PeerReviewSchema);
