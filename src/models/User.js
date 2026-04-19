const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  avatarUrl: {
    type: String
  },
  preferences: {
    dailyGoal: {
      type: Number,
      default: 20
    },
    maxSessionSize: {
      type: Number,
      default: 10
    },
    preferredCategories: [{
      type: String
    }]
  },
  stats: {
    totalReviews: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);