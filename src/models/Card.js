const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  approachOrder: {
    type: Number,
    required: true
  },
  intuition: {
    type: String,
    required: true
  },
  steps: [{
    type: String
  }],
  code: {
    language: {
      type: String,
      required: true
    },
    snippet: {
      type: String,
      required: true
    }
  },
  timeComplexity: {
    type: String,
    required: true
  },
  spaceComplexity: {
    type: String,
    required: true
  }
}, { _id: false });

const cardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  questionName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  tags: [{
    type: String
  }],
  solutions: {
    type: [solutionSchema],
    required: true,
    validate: {
      validator: function(solutions) {
        return solutions.length > 0;
      },
      message: 'Card must have at least one solution'
    }
  },
  selectedSolutionIndex: {
    type: Number,
    default: 0
  },
  revisionNotes: {
    type: String
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
  repetition: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    default: Date.now
  },
  lastReviewed: {
    type: Date
  },
  lastQuality: {
    type: Number
  },
  lapseCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

cardSchema.index({ userId: 1, dueDate: 1 });
cardSchema.index({ userId: 1, category: 1 });
cardSchema.index({ userId: 1, difficulty: 1 });

module.exports = mongoose.model('Card', cardSchema);