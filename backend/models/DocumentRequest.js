const mongoose = require('mongoose');

const DocumentRequestSchema = new mongoose.Schema(
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
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Request title is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    documentType: {
      type: String,
      enum: ['pdf', 'image', 'video', 'presentation', 'document', 'github_link', 'other'],
      required: true,
    },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['open', 'submitted', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DocumentRequest', DocumentRequestSchema);
