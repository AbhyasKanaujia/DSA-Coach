const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const { AUTH } = require('../config/constants');

class UserService {
  async createUser(data) {
    const { email, password, name } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userData = {
      email,
      passwordHash,
      name,
      preferences: {
        dailyGoal: 20,
        maxSessionSize: 10,
        preferredCategories: []
      },
      stats: {
        totalReviews: 0,
        streak: 0,
        lastActiveDate: null
      }
    };

    const user = await userRepository.create(userData);
    return this.sanitizeUser(user);
  }

  async authenticate(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: AUTH.JWT_EXPIRES_IN }
    );

    return { token, user: this.sanitizeUser(user) };
  }

  async updateUser(userId, updates) {
    const allowedFields = ['name', 'avatarUrl', 'preferences'];
    const filteredUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    const user = await userRepository.update(userId, filteredUpdates);
    return this.sanitizeUser(user);
  }

  async updateStatsOnReview(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.stats.lastActiveDate
      ? new Date(user.stats.lastActiveDate)
      : null;
    lastActive?.setHours(0, 0, 0, 0);

    let streakIncrement = 0;

    if (!lastActive) {
      streakIncrement = 1;
    } else {
      const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        streakIncrement = 0;
      } else if (diffDays === 1) {
        streakIncrement = 1;
      } else {
        streakIncrement = 1;
      }
    }

    const updatedUser = await userRepository.incrementStats(userId, {
      totalReviews: 1,
      streak: streakIncrement,
      lastActiveDate: new Date()
    });

    return updatedUser.stats;
  }

  async getUserStats(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.stats;
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user.toObject();
    return sanitized;
  }
}

module.exports = new UserService();