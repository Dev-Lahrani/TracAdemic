const mongoose = require('mongoose');

const DoubtSchema = new mongoose.Schema(
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
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Doubt title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    body: {
      type: String,
      required: [true, 'Doubt body is required'],
      maxlength: [5000, 'Body cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'answered', 'closed'],
      default: 'open',
    },
    replies: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        body: {
          type: String,
          required: true,
          maxlength: [5000, 'Reply cannot exceed 5000 characters'],
        },
        isAccepted: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doubt', DoubtSchema);
