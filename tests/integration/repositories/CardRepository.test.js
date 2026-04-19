const cardRepository = require('../../../src/repositories/CardRepository');
const Card = require('../../../src/models/Card');
const { createTestUser } = require('../../setup/seed');

describe('CardRepository Integration Tests', () => {
  let userId;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user._id;
  });

  describe('create', () => {
    it('should create a new card', async () => {
      const cardData = {
        userId,
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
        tags: ['hashmap'],
        solutions: [{
          name: 'Brute Force',
          approachOrder: 0,
          intuition: 'Check all pairs',
          steps: ['Iterate', 'Check pairs'],
          code: { language: 'js', snippet: 'code' },
          timeComplexity: 'O(n²)',
          spaceComplexity: 'O(1)'
        }]
      };

      const card = await cardRepository.create(cardData);

      expect(card).toBeDefined();
      expect(card.questionName).toBe(cardData.questionName);
      expect(card.category).toBe(cardData.category);
      expect(card.difficulty).toBe(cardData.difficulty);
      expect(card.solutions).toHaveLength(1);
      expect(card._id).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find card by id with user ownership check', async () => {
      const cardData = {
        userId,
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
      };

      const createdCard = await cardRepository.create(cardData);
      const foundCard = await cardRepository.findById(createdCard._id, userId);

      expect(foundCard).toBeDefined();
      expect(foundCard._id.toString()).toBe(createdCard._id.toString());
    });

    it('should return null for card belonging to different user', async () => {
      const otherUser = await createTestUser();
      const cardData = {
        userId: otherUser._id,
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
      };

      const createdCard = await cardRepository.create(cardData);
      const foundCard = await cardRepository.findById(createdCard._id, userId);

      expect(foundCard).toBeNull();
    });

    it('should return null for non-existing card', async () => {
      const foundCard = await cardRepository.findById('507f1f77bcf86cd799439011', userId);

      expect(foundCard).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await cardRepository.create({
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

      await cardRepository.create({
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

    it('should find all cards for user', async () => {
      const cards = await cardRepository.findAll(userId, {}, {});

      expect(cards).toHaveLength(2);
    });

    it('should filter by category', async () => {
      const cards = await cardRepository.findAll(userId, { category: 'Array' }, {});

      expect(cards).toHaveLength(1);
      expect(cards[0].category).toBe('Array');
    });

    it('should filter by difficulty', async () => {
      const cards = await cardRepository.findAll(userId, { difficulty: 'easy' }, {});

      expect(cards).toHaveLength(1);
      expect(cards[0].difficulty).toBe('easy');
    });

    it('should paginate results', async () => {
      const cards = await cardRepository.findAll(userId, {}, { page: 1, limit: 1 });

      expect(cards).toHaveLength(1);
    });

    it('should use default pagination when not provided', async () => {
      const cards = await cardRepository.findAll(userId);

      expect(cards).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update card fields', async () => {
      const cardData = {
        userId,
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
      };

      const createdCard = await cardRepository.create(cardData);
      const updatedCard = await cardRepository.update(createdCard._id, userId, {
        questionName: 'Updated'
      });

      expect(updatedCard.questionName).toBe('Updated');
    });

    it('should return null for card belonging to different user', async () => {
      const otherUser = await createTestUser();
      const cardData = {
        userId: otherUser._id,
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
      };

      const createdCard = await cardRepository.create(cardData);
      const updatedCard = await cardRepository.update(createdCard._id, userId, {
        questionName: 'Updated'
      });

      expect(updatedCard).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete card', async () => {
      const cardData = {
        userId,
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
      };

      const createdCard = await cardRepository.create(cardData);
      const deletedCard = await cardRepository.delete(createdCard._id, userId);

      expect(deletedCard).toBeDefined();
      expect(deletedCard._id.toString()).toBe(createdCard._id.toString());

      const foundCard = await cardRepository.findById(createdCard._id, userId);
      expect(foundCard).toBeNull();
    });

    it('should return null for card belonging to different user', async () => {
      const otherUser = await createTestUser();
      const cardData = {
        userId: otherUser._id,
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
      };

      const createdCard = await cardRepository.create(cardData);
      const deletedCard = await cardRepository.delete(createdCard._id, userId);

      expect(deletedCard).toBeNull();
    });
  });

  describe('findDueCards', () => {
    it('should find cards due for review', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      await cardRepository.create({
        userId,
        questionName: 'Due Card',
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

      await cardRepository.create({
        userId,
        questionName: 'Future Card',
        category: 'Array',
        difficulty: 'easy',
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

      const dueCards = await cardRepository.findDueCards(userId, now, 10);

      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].questionName).toBe('Due Card');
    });

    it('should limit results', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      for (let i = 0; i < 5; i++) {
        await cardRepository.create({
          userId,
          questionName: `Card ${i}`,
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
      }

      const dueCards = await cardRepository.findDueCards(userId, now, 3);

      expect(dueCards).toHaveLength(3);
    });

    it('should use default limit of 10 when not provided', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      for (let i = 0; i < 15; i++) {
        await cardRepository.create({
          userId,
          questionName: `Card ${i}`,
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
      }

      const dueCards = await cardRepository.findDueCards(userId, now);

      expect(dueCards).toHaveLength(10);
    });
  });

  describe('countDueCards', () => {
    it('should count due cards', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      for (let i = 0; i < 3; i++) {
        await cardRepository.create({
          userId,
          questionName: `Card ${i}`,
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
      }

      const count = await cardRepository.countDueCards(userId, now);

      expect(count).toBe(3);
    });
  });

  describe('updateSR', () => {
    it('should update spaced repetition fields', async () => {
      const cardData = {
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
      };

      const createdCard = await cardRepository.create(cardData);
      const srFields = {
        easeFactor: 2.6,
        interval: 1,
        repetition: 1,
        dueDate: new Date(),
        lastReviewed: new Date(),
        lastQuality: 5
      };

      const updatedCard = await cardRepository.updateSR(createdCard._id, userId, srFields);

      expect(updatedCard.easeFactor).toBe(2.6);
      expect(updatedCard.interval).toBe(1);
      expect(updatedCard.repetition).toBe(1);
    });
  });

  describe('incrementLapse', () => {
    it('should increment lapse count', async () => {
      const cardData = {
        userId,
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
        lapseCount: 2,
        solutions: [{
          name: 'Solution 1',
          approachOrder: 0,
          intuition: 'Test',
          steps: [],
          code: { language: 'js', snippet: 'code' },
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        }]
      };

      const createdCard = await cardRepository.create(cardData);
      const updatedCard = await cardRepository.incrementLapse(createdCard._id, userId);

      expect(updatedCard.lapseCount).toBe(3);
    });
  });

  describe('addSolution', () => {
    it('should add solution to card', async () => {
      const cardData = {
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
      };

      const createdCard = await cardRepository.create(cardData);
      const newSolution = {
        name: 'Solution 2',
        approachOrder: 1,
        intuition: 'New approach',
        steps: [],
        code: { language: 'js', snippet: 'code' },
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      };

      const updatedCard = await cardRepository.addSolution(createdCard._id, userId, newSolution);

      expect(updatedCard.solutions).toHaveLength(2);
      expect(updatedCard.solutions[1].name).toBe('Solution 2');
    });
  });

  describe('updateSolution', () => {
    it('should update solution at index', async () => {
      const cardData = {
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
      };

      const createdCard = await cardRepository.create(cardData);
      const updatedCard = await cardRepository.updateSolution(createdCard._id, userId, 0, {
        name: 'Updated Solution'
      });

      expect(updatedCard.solutions[0].name).toBe('Updated Solution');
    });
  });
});