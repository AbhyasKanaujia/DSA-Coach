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
        userService.createUser({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow('Email already registered');
    });

    it('should initialize default preferences', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        _id: 'user123',
        toObject: () => ({ _id: 'user123' })
      });

      await userService.createUser({ email: 'test@example.com', password: 'password123' });

      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.preferences).toEqual({
        dailyGoal: 20,
        maxSessionSize: 10,
        preferredCategories: []
      });
    });

    it('should initialize default stats', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        _id: 'user123',
        toObject: () => ({ _id: 'user123' })
      });

      await userService.createUser({ email: 'test@example.com', password: 'password123' });

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
        { userId: 'user123', email: 'test@example.com' },
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

  describe('updateUser', () => {
    it('should update allowed fields only', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Updated Name',
        toObject: () => ({ _id: 'user123', name: 'Updated Name' })
      };
      userRepository.update.mockResolvedValue(mockUser);

      const result = await userService.updateUser('user123', {
        name: 'Updated Name',
        passwordHash: 'shouldNotUpdate'
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          name: 'Updated Name'
        })
      );
      expect(userRepository.update).not.toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          passwordHash: 'shouldNotUpdate'
        })
      );
    });
  });

  describe('updateStatsOnReview', () => {
    it('should increment totalReviews', async () => {
      const mockUser = {
        _id: 'user123',
        stats: { totalReviews: 5, streak: 3, lastActiveDate: new Date() }
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.incrementStats.mockResolvedValue({
        _id: 'user123',
        stats: { totalReviews: 6, streak: 4, lastActiveDate: new Date() }
      });

      await userService.updateStatsOnReview('user123');

      expect(userRepository.incrementStats).toHaveBeenCalledWith('user123', {
        totalReviews: 1,
        streak: expect.any(Number),
        lastActiveDate: expect.any(Date)
      });
    });

    it('should increment streak for consecutive days', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockUser = {
        _id: 'user123',
        stats: { totalReviews: 5, streak: 3, lastActiveDate: yesterday }
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.incrementStats.mockResolvedValue({ _id: 'user123', stats: { totalReviews: 6, streak: 4 } });

      await userService.updateStatsOnReview('user123');

      const incrementCall = userRepository.incrementStats.mock.calls[0][1];
      expect(incrementCall.streak).toBe(1);
    });

    it('should not increment streak for same day', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockUser = {
        _id: 'user123',
        stats: { totalReviews: 5, streak: 3, lastActiveDate: today }
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.incrementStats.mockResolvedValue({ _id: 'user123', stats: { totalReviews: 6, streak: 3 } });

      await userService.updateStatsOnReview('user123');

      const incrementCall = userRepository.incrementStats.mock.calls[0][1];
      expect(incrementCall.streak).toBe(0);
    });

    it('should reset streak for gap > 1 day', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockUser = {
        _id: 'user123',
        stats: { totalReviews: 5, streak: 10, lastActiveDate: twoDaysAgo }
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.incrementStats.mockResolvedValue({ _id: 'user123', stats: { totalReviews: 6, streak: 1 } });

      await userService.updateStatsOnReview('user123');

      const incrementCall = userRepository.incrementStats.mock.calls[0][1];
      expect(incrementCall.streak).toBe(1);
    });

    it('should throw error if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.updateStatsOnReview('user123')).rejects.toThrow('User not found');
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      const mockStats = { totalReviews: 10, streak: 5, lastActiveDate: new Date() };
      const mockUser = { _id: 'user123', stats: mockStats };
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserStats('user123');

      expect(result).toEqual(mockStats);
    });

    it('should throw error if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserStats('user123')).rejects.toThrow('User not found');
    });
  });
});