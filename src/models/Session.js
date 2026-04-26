const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  queuedProblemIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  attemptedProblemIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  config: {
    limit: {
      type: Number,
      default: 10
    },
    maxNew: {
      type: Number,
      default: 3
    }
  },
  meta: {
    dueCount: {
      type: Number,
      default: 0
    },
    newCount: {
      type: Number,
      default: 0
    },
    totalAvailable: {
      type: Number,
      default: 0
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);