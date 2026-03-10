const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: ['pdf', 'image', 'video', 'presentation', 'document', 'github_link', 'other'],
      required: true,
    },
    // For file uploads
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    // For GitHub/external links
    externalUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision_requested'],
      default: 'pending',
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentRequest',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: { type: Date },
    feedback: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);
