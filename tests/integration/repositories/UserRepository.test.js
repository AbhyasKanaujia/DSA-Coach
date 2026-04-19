const userRepository = require('../../../src/repositories/UserRepository');
const User = require('../../../src/models/User');

describe('UserRepository Integration Tests', () => {
  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User'
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.name).toBe(userData.name);
      expect(user._id).toBeDefined();
    });

    it('should enforce email uniqueness', async () => {
      const userData = {
        email: 'duplicate@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User'
      };

      await userRepository.create(userData);

      await expect(
        userRepository.create(userData)
      ).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'find@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User'
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findByEmail('find@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(createdUser._id.toString());
      expect(foundUser.email).toBe(userData.email);
    });

    it('should return null for non-existing email', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');

      expect(foundUser).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userData = {
        email: 'findbyid@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User'
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findById(createdUser._id);

      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(createdUser._id.toString());
    });

    it('should return null for invalid id', async () => {
      const foundUser = await userRepository.findById('507f1f77bcf86cd799439011');

      expect(foundUser).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const userData = {
        email: 'update@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User'
      };

      const createdUser = await userRepository.create(userData);
      const updatedUser = await userRepository.update(createdUser._id, {
        name: 'Updated Name'
      });

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe(userData.email);
    });

    it('should update user fields', async () => {
      const userData = {
        email: 'validate@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User'
      };

      const createdUser = await userRepository.create(userData);
      const updatedUser = await userRepository.update(createdUser._id, {
        name: 'Updated Name'
      });

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe(userData.email);
    });
  });

  describe('incrementStats', () => {
    it('should increment numeric stats fields', async () => {
      const userData = {
        email: 'stats@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User',
        stats: {
          totalReviews: 5,
          streak: 2,
          lastActiveDate: new Date()
        }
      };

      const createdUser = await userRepository.create(userData);
      const updatedUser = await userRepository.incrementStats(createdUser._id, {
        totalReviews: 1,
        streak: 1
      });

      expect(updatedUser.stats.totalReviews).toBe(6);
      expect(updatedUser.stats.streak).toBe(3);
    });

    it('should set date fields directly', async () => {
      const userData = {
        email: 'datestats@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User',
        stats: {
          totalReviews: 0,
          streak: 0,
          lastActiveDate: null
        }
      };

      const createdUser = await userRepository.create(userData);
      const newDate = new Date();
      const updatedUser = await userRepository.incrementStats(createdUser._id, {
        lastActiveDate: newDate
      });

      expect(updatedUser.stats.lastActiveDate).toBeDefined();
      expect(updatedUser.stats.lastActiveDate.toISOString()).toBe(newDate.toISOString());
    });

    it('should handle mixed field types', async () => {
      const userData = {
        email: 'mixed@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User',
        stats: {
          totalReviews: 5,
          streak: 2,
          lastActiveDate: new Date()
        }
      };

      const createdUser = await userRepository.create(userData);
      const newDate = new Date();
      const updatedUser = await userRepository.incrementStats(createdUser._id, {
        totalReviews: 1,
        lastActiveDate: newDate
      });

      expect(updatedUser.stats.totalReviews).toBe(6);
      expect(updatedUser.stats.lastActiveDate.toISOString()).toBe(newDate.toISOString());
    });
  });
});