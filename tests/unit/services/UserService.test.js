const userService = require('../../../src/services/UserService');
const userRepository = require('../../../src/repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../../src/repositories/UserRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        toObject: () => ({ _id: 'user123', email: 'test@example.com', name: 'Test User' })
      };
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          passwordHash: 'hashedPassword',
          name: 'Test User'
        })
      );
      expect(result).toEqual({ _id: 'user123', email: 'test@example.com', name: 'Test User' });
    });

    it('should throw error if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ _id: 'existing123' });

      await expect(
        userService.createUser({ email: 'test@example.com', password: 'password123', name: 'Test User' })
      ).rejects.toThrow('Email already registered');
    });

    it('should initialize default preferences', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        _id: 'user123',
        toObject: () => ({ _id: 'user123' })
      });

      await userService.createUser({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.preferences).toEqual({
        dailyGoal: 20,
        maxSessionSize: 10
      });
    });

    it('should initialize default stats', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        _id: 'user123',
        toObject: () => ({ _id: 'user123' })
      });

      await userService.createUser({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.stats).toEqual({
        totalReviews: 0,
        streak: 0,
        lastActiveDate: null
      });
    });
  });

  describe('authenticate', () => {
    it('should authenticate valid credentials and return token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        toObject: () => ({ _id: 'user123', email: 'test@example.com', passwordHash: 'hashedPassword' })
      };
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token123');

      const result = await userService.authenticate('test@example.com', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', role: undefined },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toEqual({
        token: 'token123',
        user: { _id: 'user123', email: 'test@example.com' }
      });
    });

    it('should throw error for invalid email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        userService.authenticate('test@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com', passwordHash: 'hashedPassword' };
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        userService.authenticate('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Updated Name',
        preferences: { dailyGoal: 20, maxSessionSize: 10 },
        toObject: () => ({ _id: 'user123', name: 'Updated Name', preferences: { dailyGoal: 20, maxSessionSize: 10 } })
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(mockUser);

      const result = await userService.updateProfile('user123', {
        name: 'Updated Name'
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          name: 'Updated Name'
        })
      );
      expect(result).toEqual({ _id: 'user123', name: 'Updated Name', preferences: { dailyGoal: 20, maxSessionSize: 10 } });
    });

    it('should merge preferences when updating profile', async () => {
      const mockUser = {
        _id: 'user123',
        preferences: { dailyGoal: 20, maxSessionSize: 10 },
        toObject: () => ({ _id: 'user123', preferences: { dailyGoal: 30, maxSessionSize: 10 } })
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(mockUser);

      await userService.updateProfile('user123', {
        preferences: { dailyGoal: 30 }
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          preferences: { dailyGoal: 30, maxSessionSize: 10 }
        })
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences only', async () => {
      const mockUser = {
        _id: 'user123',
        preferences: { dailyGoal: 20, maxSessionSize: 10 },
        toObject: () => ({ _id: 'user123', preferences: { dailyGoal: 30, maxSessionSize: 10 } })
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(mockUser);

      const result = await userService.updatePreferences('user123', {
        dailyGoal: 30
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        'user123',
        { preferences: { dailyGoal: 30, maxSessionSize: 10 } }
      );
      expect(result).toEqual({ _id: 'user123', preferences: { dailyGoal: 30, maxSessionSize: 10 } });
    });

    it('should merge with existing preferences', async () => {
      const mockUser = {
        _id: 'user123',
        preferences: { dailyGoal: 20, maxSessionSize: 10 },
        toObject: () => ({ _id: 'user123', preferences: { dailyGoal: 20, maxSessionSize: 15 } })
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(mockUser);

      await userService.updatePreferences('user123', {
        maxSessionSize: 15
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        'user123',
        { preferences: { dailyGoal: 20, maxSessionSize: 15 } }
      );
    });
  });

  describe('updateLastActive', () => {
    it('should update lastActiveDate', async () => {
      const updatedDate = new Date();
      const mockUser = {
        _id: 'user123',
        stats: { totalReviews: 5, streak: 3, lastActiveDate: updatedDate },
        toObject: () => ({ _id: 'user123', stats: { totalReviews: 5, streak: 3, lastActiveDate: updatedDate } })
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(mockUser);

      const result = await userService.updateLastActive('user123');

      expect(userRepository.update).toHaveBeenCalledWith(
        'user123',
        { 'stats.lastActiveDate': expect.any(Date) }
      );
      expect(result.stats.lastActiveDate).toBeInstanceOf(Date);
    });

    it('should throw error if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.updateLastActive('user123')).rejects.toThrow('User not found');
    });
  });
});