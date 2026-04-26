const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Problem = require('../../../src/models/Problem');
const ProblemContent = require('../../../src/models/ProblemContent');
const UserProblemState = require('../../../src/models/UserProblemState');
const Collection = require('../../../src/models/Collection');
const UserCollection = require('../../../src/models/UserCollection');
const Session = require('../../../src/models/Session');

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

    it('should start a session and return due problems with sessionId', async () => {
      const response = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.problems).toBeDefined();
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.status).toBe('active');
      expect(response.body.config).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.dueCount).toBeGreaterThanOrEqual(0);
    });

    it('should create a Session document in the database', async () => {
      const response = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const session = await Session.findById(response.body.sessionId);
      expect(session).not.toBeNull();
      expect(session.status).toBe('active');
      expect(session.userId.toString()).toBe(userId.toString());
    });

    it('should return empty session when no active collections', async () => {
      await UserCollection.deleteMany({ userId });

      const response = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.problems).toHaveLength(0);
      expect(response.body.meta.queuedCount).toBe(0);
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

    it('should abandon previous active session when starting new one', async () => {
      const first = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const second = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const firstSession = await Session.findById(first.body.sessionId);
      expect(firstSession.status).toBe('abandoned');

      const secondSession = await Session.findById(second.body.sessionId);
      expect(secondSession.status).toBe('active');
    });
  });

  describe('GET /api/sessions/:sessionId', () => {
    it('should return session details', async () => {
      const startResponse = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const response = await request(app)
        .get(`/api/sessions/${startResponse.body.sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(startResponse.body.sessionId);
    });

    it('should return 404 for nonexistent session', async () => {
      const response = await request(app)
        .get('/api/sessions/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/sessions/507f1f77bcf86cd799439011');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/sessions/:sessionId/complete', () => {
    it('should complete an active session', async () => {
      const startResponse = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const response = await request(app)
        .post(`/api/sessions/${startResponse.body.sessionId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
    });

    it('should return 409 when completing already completed session', async () => {
      const startResponse = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      await request(app)
        .post(`/api/sessions/${startResponse.body.sessionId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .post(`/api/sessions/${startResponse.body.sessionId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/sessions/:sessionId/abandon', () => {
    it('should abandon an active session', async () => {
      const startResponse = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const response = await request(app)
        .post(`/api/sessions/${startResponse.body.sessionId}/abandon`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('abandoned');
    });
  });

  describe('GET /api/sessions', () => {
    it('should return user session history', async () => {
      await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});