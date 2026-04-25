const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Problem = require('../../../src/models/Problem');
const ProblemContent = require('../../../src/models/ProblemContent');
const UserProblemState = require('../../../src/models/UserProblemState');

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

  describe('GET /api/sessions', () => {
    let problem1, problem2, problem3;

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
        nextReviewAt: yesterday
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
        nextReviewAt: yesterday
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
        nextReviewAt: new Date(now.getTime() + 86400000)
      });
    });

    it('should get due problems for session', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.problems).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.totalDue).toBe(2);
    });

    it('should limit session size', async () => {
      const response = await request(app)
        .get('/api/sessions?limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.problems).toHaveLength(1);
      expect(response.body.totalDue).toBe(2);
    });

    it('should return empty session when no problems are due', async () => {
      await UserProblemState.deleteMany({ userId });

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.problems).toHaveLength(0);
      expect(response.body.count).toBe(0);
      expect(response.body.totalDue).toBe(0);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/sessions');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/sessions/review', () => {
    let problemId;

    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const problem = await Problem.create({
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        createdBy: userId
      });

      await ProblemContent.create({
        problemId: problem._id,
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
        problemId: problem._id,
        nextReviewAt: yesterday,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0
      });

      problemId = problem._id;
    });

    it('should submit review with easy quality', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy'
        });

      expect(response.status).toBe(200);
      expect(response.body.state).toBeDefined();
      expect(response.body.nextDue).toBeDefined();
      expect(response.body.easeFactor).toBeGreaterThan(2.5);
      expect(response.body.interval).toBe(1);
    });

    it('should submit review with hard quality', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'hard'
        });

      expect(response.status).toBe(200);
      expect(response.body.state).toBeDefined();
      expect(response.body.nextDue).toBeDefined();
    });

    it('should submit review with again quality', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'again'
        });

      expect(response.status).toBe(200);
      expect(response.body.state).toBeDefined();
      expect(response.body.nextDue).toBeDefined();
      expect(response.body.easeFactor).toBeLessThanOrEqual(2.5);
    });

    it('should return 400 if problemId is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          quality: 'easy'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if quality is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if quality is invalid', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('quality');
    });

    it('should return 404 for non-existing problem state', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: '507f1f77bcf86cd799439011',
          quality: 'easy'
        });

      expect(response.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .send({
          problemId: problemId.toString(),
          quality: 'easy'
        });

      expect(response.status).toBe(401);
    });
  });
});