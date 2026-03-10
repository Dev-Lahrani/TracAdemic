const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['leader', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    inviteToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Generate invite token pre-save
TeamSchema.pre('save', function (next) {
  if (!this.inviteToken) {
    this.inviteToken = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Team', TeamSchema);
