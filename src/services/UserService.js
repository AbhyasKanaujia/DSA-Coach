const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const { AUTH } = require('../config/constants');
const {
  validateUserCreation,
  validateUserUpdate,
  validators,
  AuthenticationError,
  NotFoundError,
  ConflictError
} = require('../utils/validators');

class UserService {
  async createUser(data) {
    const validated = validateUserCreation(data);
    const { email, password, name } = validated;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userData = {
      email,
      passwordHash,
      name,
      preferences: {
        dailyGoal: 20,
        maxSessionSize: 10
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
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: AUTH.JWT_EXPIRES_IN }
    );

    return { token, user: this.sanitizeUser(user) };
  }

  async updateProfile(userId, updates) {
    const validated = validateUserUpdate(updates);

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const finalUpdates = { ...validated };

    if (validated.preferences) {
      finalUpdates.preferences = this.mergePreferences(user.preferences, validated.preferences);
    }

    const updatedUser = await userRepository.update(userId, finalUpdates);
    return this.sanitizeUser(updatedUser);
  }

  async updatePreferences(userId, preferences) {
    const validated = validators.preferences(preferences);

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const mergedPreferences = this.mergePreferences(user.preferences, validated);
    const updatedUser = await userRepository.update(userId, { preferences: mergedPreferences });
    return this.sanitizeUser(updatedUser);
  }

  async updateLastActive(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await userRepository.update(userId, {
      'stats.lastActiveDate': new Date()
    });
    return this.sanitizeUser(updatedUser);
  }

  mergePreferences(existingPreferences, newPreferences) {
    const defaultPreferences = {
      dailyGoal: 20,
      maxSessionSize: 10
    };

    return {
      ...defaultPreferences,
      ...existingPreferences,
      ...newPreferences
    };
  }

  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.sanitizeUser(user);
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user.toObject();
    return sanitized;
  }
}

module.exports = new UserService();