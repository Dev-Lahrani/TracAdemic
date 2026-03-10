const mongoose = require('mongoose');

const IndustryProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    requiredSkills: [{ type: String }],
    domain: { type: String },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    minTeamSize: { type: Number, default: 1 },
    maxTeamSize: { type: Number, default: 5 },
    deadline: { type: Date },
    stipend: { type: String },
    status: {
      type: String,
      enum: ['open', 'closed', 'in_progress', 'completed'],
      default: 'open',
    },
    applicationCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IndustryProject', IndustryProjectSchema);
