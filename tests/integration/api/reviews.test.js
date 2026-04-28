const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Problem = require('../../../src/models/Problem');
const ProblemContent = require('../../../src/models/ProblemContent');
const UserProblemState = require('../../../src/models/UserProblemState');
const Collection = require('../../../src/models/Collection');
const UserCollection = require('../../../src/models/UserCollection');
const Session = require('../../../src/models/Session');
const Attempt = require('../../../src/models/Attempt');

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

    it('should submit review with easy quality and return attemptId', async () => {
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
      expect(response.body.attemptId).toBeDefined();
    });

    it('should create an Attempt document in the database', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy'
        });

      const attempts = await Attempt.find({ userId, problemId });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].quality).toBe('easy');
      expect(attempts[0].previousStatus).toBe('new');
      expect(attempts[0].newStatus).toBe('learning');
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
      expect(response.body.easeFactor).toBeLessThanOrEqual(2.5);
    });

    it('should return 400 if problemId is missing', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ quality: 'easy' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if quality is missing', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ problemId: problemId.toString() });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if quality is invalid', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ problemId: problemId.toString(), quality: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error.toLowerCase()).toContain('quality');
    });

    it('should return 400 for invalid sessionId format', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy',
          sessionId: 'not-valid'
        });

      expect(response.status).toBe(400);
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

  describe('Review with Session', () => {
    let problemId, sessionId;

    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const problem = await Problem.create({
        title: 'Session Review Problem',
        description: 'Test problem for session review',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: 'sr1',
        createdBy: userId
      });

      problemId = problem._id;

      await UserProblemState.create({
        userId,
        problemId: problem._id,
        nextReviewAt: yesterday,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        status: 'new'
      });

      const collection = await Collection.create({
        name: 'Review Test Collection',
        description: 'Test',
        problemIds: [problemId],
        createdBy: userId,
        isPublic: true
      });

      await UserCollection.create({
        userId,
        collectionId: collection._id,
        isActive: true
      });

      const startResponse = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      sessionId = startResponse.body.sessionId;
    });

    it('should submit review with valid sessionId', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy',
          sessionId: sessionId
        });

      expect(response.status).toBe(200);
      expect(response.body.attemptId).toBeDefined();
    });

    it('should create Attempt with sessionId', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy',
          sessionId: sessionId
        });

      const attempt = await Attempt.findOne({ userId, problemId });
      expect(attempt.sessionId.toString()).toBe(sessionId);
    });

    it('should update session attemptedProblemIds', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy',
          sessionId: sessionId
        });

      const session = await Session.findById(sessionId);
      expect(session.attemptedProblemIds.map(id => id.toString())).toContain(problemId.toString());
    });

    it('should auto-complete session when all problems reviewed', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy',
          sessionId: sessionId
        });

      const session = await Session.findById(sessionId);
      expect(session.status).toBe('completed');
    });

    it('should return 409 when reviewing in an abandoned session (cross-tab)', async () => {
      // Tab B starts a new session, which abandons Tab A's session
      await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy',
          sessionId: sessionId
        });

      expect(response.status).toBe(409);

      const oldSession = await Session.findById(sessionId);
      expect(oldSession.status).toBe('abandoned');
    });

    it('should return 409 when reviewing in a completed session', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'easy',
          sessionId: sessionId
        });

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemId: problemId.toString(),
          quality: 'hard',
          sessionId: sessionId
        });

      expect(response.status).toBe(409);
    });
  });
});