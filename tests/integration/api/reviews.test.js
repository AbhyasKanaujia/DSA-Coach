const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Problem = require('../../../src/models/Problem');
const ProblemContent = require('../../../src/models/ProblemContent');
const UserProblemState = require('../../../src/models/UserProblemState');

describe('Reviews API Integration Tests', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await User.create({
      email: 'reviews@example.com',
      passwordHash,
      name: 'Reviews User'
    });

    userId = user._id;

    const jwt = require('jsonwebtoken');
    token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/reviews', () => {
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
        repetitions: 0,
        status: 'new'
      });

      problemId = problem._id;
    });

    it('should submit review with easy quality', async () => {
      const response = await request(app)
        .post('/api/reviews')
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
      expect(response.body.status).toBe('learning');
    });

    it('should submit review with hard quality', async () => {
      const response = await request(app)
        .post('/api/reviews')
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
        .post('/api/reviews')
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
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          quality: 'easy'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if quality is missing', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if quality is invalid', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.toLowerCase()).toContain('quality');
    });

    it('should return 404 for non-existing problem state', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: '507f1f77bcf86cd799439011',
          quality: 'easy'
        });

      expect(response.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          problemId: problemId.toString(),
          quality: 'easy'
        });

      expect(response.status).toBe(401);
    });

    it('should transition status from new to learning on first review', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('learning');
    });
  });
});