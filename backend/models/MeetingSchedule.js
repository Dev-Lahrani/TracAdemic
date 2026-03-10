const mongoose = require('mongoose');

const MeetingScheduleSchema = new mongoose.Schema(
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
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date/time is required'],
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: [1, 'Duration must be at least 1 minute'],
    },
    meetingLink: { type: String },
    location: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    aiSummary: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeetingSchedule', MeetingScheduleSchema);
