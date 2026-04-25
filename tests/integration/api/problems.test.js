const request = require('supertest');
const app = require('../../../src/app');
const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const Problem = require('../../../src/models/Problem');
const ProblemContent = require('../../../src/models/ProblemContent');
const jwt = require('jsonwebtoken');

describe('Problems API Integration Tests', () => {
  let adminToken, userToken, adminUser, regularUser;
  let createdProblemId;

  const sampleProblem = {
    title: 'Two Sum',
    description: 'Given an array of integers, return indices of the two numbers that add up to target.',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    companies: ['google', 'amazon'],
    source: 'leetcode',
    sourceId: '1',
    solutions: [{
      name: 'Hash Map Approach',
      intuition: 'Use a hash map to store complements',
      steps: ['Iterate through array', 'Check if complement exists in map', 'Return indices'],
      codeSnippets: [{ language: 'python', code: 'def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i' }],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)'
    }]
  };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-flashcard-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Problem.deleteMany({});
    await ProblemContent.deleteMany({});

    adminUser = await User.create({
      email: 'admin-problem@test.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      name: 'Admin User',
      role: 'admin'
    });

    regularUser = await User.create({
      email: 'user-problem@test.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      name: 'Regular User',
      role: 'user'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: 'admin' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: regularUser._id.toString(), role: 'user' },
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/problems', () => {
    it('should create a problem with admin token', async () => {
      const response = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleProblem);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Two Sum');
      expect(response.body.difficulty).toBe('easy');
      createdProblemId = response.body.id;
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${userToken}`)
        .send(sampleProblem);

      expect(response.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/problems')
        .send(sampleProblem);

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing title', async () => {
      const { title, ...noTitle } = sampleProblem;
      const response = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(noTitle);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid difficulty', async () => {
      const response = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...sampleProblem, difficulty: 'impossible' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/problems', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleProblem);
    });

    it('should list problems for authenticated user', async () => {
      const response = await request(app)
        .get('/api/problems')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('problems');
      expect(response.body).toHaveProperty('total');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/problems');

      expect(response.status).toBe(401);
    });

    it('should filter by difficulty', async () => {
      const response = await request(app)
        .get('/api/problems?difficulty=easy')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/problems/:problemId', () => {
    let problemId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleProblem);
      problemId = res.body.id;
    });

    it('should get a problem by id', async () => {
      const response = await request(app)
        .get(`/api/problems/${problemId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Two Sum');
      expect(response.body).toHaveProperty('solutions');
    });

    it('should return 404 for non-existent problem', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/problems/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/problems/:problemId/metadata', () => {
    let problemId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleProblem);
      problemId = res.body.id;
    });

    it('should update metadata with admin token', async () => {
      const response = await request(app)
        .put(`/api/problems/${problemId}/metadata`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put(`/api/problems/${problemId}/metadata`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/problems/:problemId', () => {
    let problemId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleProblem);
      problemId = res.body.id;
    });

    it('should delete a problem with admin token', async () => {
      const response = await request(app)
        .delete(`/api/problems/${problemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/problems/${problemId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});