const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Card = require('../../../src/models/Card');

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
    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      await Card.create({
        userId,
        questionName: 'Due Card 1',
        category: 'Array',
        difficulty: 'easy',
        dueDate: yesterday,
        solutions: [{
          name: 'Solution 1',
          approachOrder: 0,
          intuition: 'Test',
          steps: [],
          code: { language: 'js', snippet: 'code' },
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        }]
      });

      await Card.create({
        userId,
        questionName: 'Due Card 2',
        category: 'String',
        difficulty: 'medium',
        dueDate: yesterday,
        solutions: [{
          name: 'Solution 1',
          approachOrder: 0,
          intuition: 'Test',
          steps: [],
          code: { language: 'js', snippet: 'code' },
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        }]
      });

      await Card.create({
        userId,
        questionName: 'Future Card',
        category: 'Tree',
        difficulty: 'hard',
        dueDate: new Date(now.getTime() + 86400000),
        solutions: [{
          name: 'Solution 1',
          approachOrder: 0,
          intuition: 'Test',
          steps: [],
          code: { language: 'js', snippet: 'code' },
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        }]
      });
    });

    it('should get due cards for session', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.totalDue).toBe(2);
    });

    it('should limit session size', async () => {
      const response = await request(app)
        .get('/api/sessions?limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(1);
      expect(response.body.totalDue).toBe(2);
    });

    it('should return empty session when no cards are due', async () => {
      await Card.deleteMany({ userId });

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(0);
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
    let cardId;

    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const card = await Card.create({
        userId,
        questionName: 'Review Card',
        category: 'Array',
        difficulty: 'easy',
        dueDate: yesterday,
        easeFactor: 2.5,
        interval: 0,
        repetition: 0,
        solutions: [{
          name: 'Solution 1',
          approachOrder: 0,
          intuition: 'Test',
          steps: [],
          code: { language: 'js', snippet: 'code' },
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        }]
      });
      cardId = card._id;
    });

    it('should submit review with easy quality', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cardId: cardId.toString(),
          quality: 'easy'
        });

      expect(response.status).toBe(200);
      expect(response.body.card).toBeDefined();
      expect(response.body.nextDue).toBeDefined();
      expect(response.body.easeFactor).toBeGreaterThan(2.5);
      expect(response.body.interval).toBe(1);
    });

    it('should submit review with medium quality', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cardId: cardId.toString(),
          quality: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body.card).toBeDefined();
      expect(response.body.nextDue).toBeDefined();
    });

    it('should submit review with hard quality', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cardId: cardId.toString(),
          quality: 'hard'
        });

      expect(response.status).toBe(200);
      expect(response.body.card).toBeDefined();
      expect(response.body.nextDue).toBeDefined();
      expect(response.body.easeFactor).toBeLessThanOrEqual(2.5);
    });

    it('should return 400 if cardId is missing', async () => {
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
          cardId: cardId.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if quality is invalid', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cardId: cardId.toString(),
          quality: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('quality');
    });

    it('should return 404 for non-existing card', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cardId: '507f1f77bcf86cd799439011',
          quality: 'easy'
        });

      expect(response.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/sessions/review')
        .send({
          cardId: cardId.toString(),
          quality: 'easy'
        });

      expect(response.status).toBe(401);
    });
  });
});