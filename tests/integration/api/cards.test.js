const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Card = require('../../../src/models/Card');

describe('Cards API Integration Tests', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await User.create({
      email: 'cards@example.com',
      passwordHash,
      name: 'Cards User'
    });

    userId = user._id;

    const jwt = require('jsonwebtoken');
    token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/cards', () => {
    it('should create a new card', async () => {
      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionName: 'Two Sum',
          category: 'Array',
          difficulty: 'easy',
          tags: ['hashmap'],
          solutions: [{
            name: 'Brute Force',
            approachOrder: 0,
            intuition: 'Check all pairs',
            steps: ['Iterate', 'Check pairs'],
            code: { language: 'javascript', snippet: 'function twoSum(nums, target) { ... }' },
            timeComplexity: 'O(n²)',
            spaceComplexity: 'O(1)'
          }]
        });

      expect(response.status).toBe(201);
      expect(response.body.questionName).toBe('Two Sum');
      expect(response.body.category).toBe('Array');
      expect(response.body.difficulty).toBe('easy');
      expect(response.body.solutions).toHaveLength(1);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionName: 'Two Sum'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({
          questionName: 'Two Sum',
          category: 'Array',
          difficulty: 'easy',
          solutions: [{
            name: 'Brute Force',
            approachOrder: 0,
            intuition: 'Check all pairs',
            steps: [],
            code: { language: 'js', snippet: 'code' },
            timeComplexity: 'O(n²)',
            spaceComplexity: 'O(1)'
          }]
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/cards', () => {
    beforeEach(async () => {
      await Card.create({
        userId,
        questionName: 'Card 1',
        category: 'Array',
        difficulty: 'easy',
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
        questionName: 'Card 2',
        category: 'String',
        difficulty: 'medium',
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

    it('should list all cards for user', async () => {
      const response = await request(app)
        .get('/api/cards')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/cards?category=Array')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].category).toBe('Array');
    });

    it('should filter by difficulty', async () => {
      const response = await request(app)
        .get('/api/cards?difficulty=easy')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].difficulty).toBe('easy');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/cards?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/cards');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/cards/:cardId', () => {
    let cardId;

    beforeEach(async () => {
      const card = await Card.create({
        userId,
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
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

    it('should get card by id', async () => {
      const response = await request(app)
        .get(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body._id.toString()).toBe(cardId.toString());
    });

    it('should return 404 for non-existing card', async () => {
      const response = await request(app)
        .get('/api/cards/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/cards/${cardId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/cards/:cardId', () => {
    let cardId;

    beforeEach(async () => {
      const card = await Card.create({
        userId,
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
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

    it('should update card', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionName: 'Updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.questionName).toBe('Updated');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({
          questionName: 'Updated'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/cards/:cardId', () => {
    let cardId;

    beforeEach(async () => {
      const card = await Card.create({
        userId,
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
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

    it('should delete card', async () => {
      const response = await request(app)
        .delete(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedCard = await Card.findById(cardId);
      expect(deletedCard).toBeNull();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/cards/${cardId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/cards/:cardId/solutions', () => {
    let cardId;

    beforeEach(async () => {
      const card = await Card.create({
        userId,
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
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

    it('should add solution to card', async () => {
      const response = await request(app)
        .post(`/api/cards/${cardId}/solutions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Solution',
          intuition: 'New approach',
          steps: [],
          code: { language: 'javascript', snippet: 'function newSolution() { ... }' },
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        });

      expect(response.status).toBe(200);
      expect(response.body.solutions).toHaveLength(2);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post(`/api/cards/${cardId}/solutions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Solution'
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post(`/api/cards/${cardId}/solutions`)
        .send({
          name: 'New Solution',
          intuition: 'New approach',
          steps: [],
          code: { language: 'js', snippet: 'code' },
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/cards/:cardId/solutions/:solutionIndex', () => {
    let cardId;

    beforeEach(async () => {
      const card = await Card.create({
        userId,
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
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

    it('should update solution at index', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}/solutions/0`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Solution'
        });

      expect(response.status).toBe(200);
      expect(response.body.solutions[0].name).toBe('Updated Solution');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}/solutions/0`)
        .send({
          name: 'Updated Solution'
        });

      expect(response.status).toBe(401);
    });
  });
});