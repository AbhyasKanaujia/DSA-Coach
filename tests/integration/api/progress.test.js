const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const UserProblemState = require('../../../src/models/UserProblemState');
const Problem = require('../../../src/models/Problem');

describe('Progress API Integration Tests', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await User.create({
      email: 'progress@example.com',
      passwordHash,
      name: 'Progress User',
      role: 'user'
    });

    userId = user._id;

    const jwt = require('jsonwebtoken');
    token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('GET /api/progress', () => {
    it('should return progress with empty mastery breakdown', async () => {
      const response = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.totalSolved).toBe(0);
      expect(response.body.totalReviewed).toBe(0);
      expect(response.body.streak).toBe(0);
      expect(response.body.masteryBreakdown).toEqual({
        new: 0,
        learning: 0,
        review: 0,
        mastered: 0
      });
    });

    it('should return progress with mastery breakdown', async () => {
      const adminUser = await User.create({
        email: 'admin@progress.test',
        passwordHash: 'hashed',
        name: 'Admin',
        role: 'admin'
      });

      const problem = await Problem.create({
        title: 'Two Sum',
        description: 'Test',
        difficulty: 'easy',
        source: 'test',
        sourceId: 'prog-1',
        createdBy: adminUser._id
      });

      await UserProblemState.create({
        userId,
        problemId: problem._id,
        status: 'learning',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReviewAt: new Date()
      });

      const response = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.totalSolved).toBe(1);
      expect(response.body.masteryBreakdown.learning).toBe(1);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/progress');

      expect(response.status).toBe(401);
    });
  });
});