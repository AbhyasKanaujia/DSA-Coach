const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Problem = require('../../../src/models/Problem');
const ProblemContent = require('../../../src/models/ProblemContent');
const UserProblemState = require('../../../src/models/UserProblemState');
const Collection = require('../../../src/models/Collection');
const UserCollection = require('../../../src/models/UserCollection');

describe('Sessions API Integration Tests', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await User.create({
      email: 'sessions@example.com',
      passwordHash,
      name: 'Sessions User'
    });

    userId = user._id;

    const jwt = require('jsonwebtoken');
    token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/sessions/start', () => {
    let problem1, problem2, problem3;
    let collection;

    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      problem1 = await Problem.create({
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        createdBy: userId
      });

      await ProblemContent.create({
        problemId: problem1._id,
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use a hash map',
          steps: [],
          codeSnippets: [],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      });

      await UserProblemState.create({
        userId,
        problemId: problem1._id,
        nextReviewAt: yesterday,
        status: 'review'
      });

      problem2 = await Problem.create({
        title: 'Binary Search',
        description: 'Search in sorted array',
        difficulty: 'medium',
        source: 'leetcode',
        sourceId: '2',
        createdBy: userId
      });

      await ProblemContent.create({
        problemId: problem2._id,
        solutions: [{
          name: 'Binary Search',
          order: 0,
          intuition: 'Divide and conquer',
          steps: [],
          codeSnippets: [],
          timeComplexity: 'O(log n)',
          spaceComplexity: 'O(1)'
        }]
      });

      await UserProblemState.create({
        userId,
        problemId: problem2._id,
        nextReviewAt: yesterday,
        status: 'review'
      });

      problem3 = await Problem.create({
        title: 'Merge Sort',
        description: 'Sort array',
        difficulty: 'hard',
        source: 'leetcode',
        sourceId: '3',
        createdBy: userId
      });

      await ProblemContent.create({
        problemId: problem3._id,
        solutions: [{
          name: 'Merge Sort',
          order: 0,
          intuition: 'Divide and merge',
          steps: [],
          codeSnippets: [],
          timeComplexity: 'O(n log n)',
          spaceComplexity: 'O(n)'
        }]
      });

      await UserProblemState.create({
        userId,
        problemId: problem3._id,
        nextReviewAt: new Date(now.getTime() + 86400000),
        status: 'learning'
      });

      collection = await Collection.create({
        name: 'Test Collection',
        description: 'A test collection',
        problemIds: [problem1._id, problem2._id, problem3._id],
        createdBy: userId,
        isPublic: true
      });

      await UserCollection.create({
        userId,
        collectionId: collection._id,
        isActive: true
      });
    });

    it('should start a session and return due problems', async () => {
      const response = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.problems).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.dueCount).toBeGreaterThanOrEqual(0);
    });

    it('should return empty session when no active collections', async () => {
      await UserCollection.deleteMany({ userId });

      const response = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.problems).toHaveLength(0);
      expect(response.body.meta.total).toBe(0);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/sessions/start')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should respect limit option', async () => {
      const response = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ limit: 1 });

      expect(response.status).toBe(200);
      expect(response.body.problems.length).toBeLessThanOrEqual(1);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ limit: 0 });

      expect(response.status).toBe(400);
    });
  });
});