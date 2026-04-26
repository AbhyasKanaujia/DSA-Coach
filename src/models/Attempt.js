const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  quality: {
    type: String,
    enum: ['again', 'hard', 'easy'],
    required: true
  },
  previousStatus: {
    type: String,
    enum: ['new', 'learning', 'review', 'mastered'],
    required: true
  },
  newStatus: {
    type: String,
    enum: ['new', 'learning', 'review', 'mastered'],
    required: true
  },
  timeTakenMs: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

attemptSchema.index({ userId: 1, problemId: 1, createdAt: -1 });
attemptSchema.index({ sessionId: 1 });
attemptSchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);