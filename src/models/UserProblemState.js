const mongoose = require('mongoose');

const userProblemStateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'learning', 'review', 'mastered'],
    default: 'new'
  },
  easeFactor: {
    type: Number,
    default: 2.5,
    min: 1.3
  },
  interval: {
    type: Number,
    default: 0
  },
  repetitions: {
    type: Number,
    default: 0
  },
  lastReviewedAt: {
    type: Date
  },
  nextReviewAt: {
    type: Date
  },
  lastResult: {
    type: String,
    enum: ['again', 'hard', 'easy']
  },
  lapseCount: {
    type: Number,
    default: 0
  },
  revisionNotes: {
    type: String
  }
}, {
  timestamps: true
});

userProblemStateSchema.index({ userId: 1, problemId: 1 }, { unique: true });
userProblemStateSchema.index({ userId: 1, nextReviewAt: 1 });
userProblemStateSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('UserProblemState', userProblemStateSchema);