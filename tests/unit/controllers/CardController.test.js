const cardController = require('../../../src/controllers/CardController');
const cardService = require('../../../src/services/CardService');

jest.mock('../../../src/services/CardService');

describe('CardController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      userId: 'user123'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createCard', () => {
    it('should create card successfully', async () => {
      req.body = {
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
        solutions: [{ name: 'Brute Force', intuition: 'Check all pairs', steps: [], code: { language: 'js', snippet: 'code' }, timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' }]
      };

      const mockCard = { _id: 'card123', ...req.body };
      cardService.createCard.mockResolvedValue(mockCard);

      await cardController.createCard(req, res, next);

      expect(cardService.createCard).toHaveBeenCalledWith('user123', req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCard);
    });

    it('should return 400 if questionName is missing', async () => {
      req.body = {
        category: 'Array',
        difficulty: 'easy',
        solutions: []
      };

      await cardController.createCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'questionName, category, difficulty, and solutions are required'
      });
      expect(cardService.createCard).not.toHaveBeenCalled();
    });

    it('should return 400 if category is missing', async () => {
      req.body = {
        questionName: 'Two Sum',
        difficulty: 'easy',
        solutions: []
      };

      await cardController.createCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'questionName, category, difficulty, and solutions are required'
      });
    });

    it('should return 400 if difficulty is missing', async () => {
      req.body = {
        questionName: 'Two Sum',
        category: 'Array',
        solutions: []
      };

      await cardController.createCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'questionName, category, difficulty, and solutions are required'
      });
    });

    it('should return 400 if solutions is missing', async () => {
      req.body = {
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy'
      };

      await cardController.createCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'questionName, category, difficulty, and solutions are required'
      });
    });

    it('should forward errors to error handler', async () => {
      req.body = {
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
        solutions: []
      };

      cardService.createCard.mockRejectedValue(new Error('Card must have at least one solution'));

      await cardController.createCard(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getCard', () => {
    it('should get card by id', async () => {
      req.params = { cardId: 'card123' };

      const mockCard = { _id: 'card123', questionName: 'Two Sum' };
      cardService.getCard.mockResolvedValue(mockCard);

      await cardController.getCard(req, res, next);

      expect(cardService.getCard).toHaveBeenCalledWith('card123', 'user123');
      expect(res.json).toHaveBeenCalledWith(mockCard);
    });

    it('should forward errors to error handler', async () => {
      req.params = { cardId: 'card123' };

      cardService.getCard.mockRejectedValue(new Error('Card not found'));

      await cardController.getCard(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateCard', () => {
    it('should update card successfully', async () => {
      req.params = { cardId: 'card123' };
      req.body = { questionName: 'Updated' };

      const mockCard = { _id: 'card123', questionName: 'Updated' };
      cardService.updateCard.mockResolvedValue(mockCard);

      await cardController.updateCard(req, res, next);

      expect(cardService.updateCard).toHaveBeenCalledWith('card123', 'user123', req.body);
      expect(res.json).toHaveBeenCalledWith(mockCard);
    });

    it('should forward errors to error handler', async () => {
      req.params = { cardId: 'card123' };
      req.body = { questionName: 'Updated' };

      cardService.updateCard.mockRejectedValue(new Error('Card not found'));

      await cardController.updateCard(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteCard', () => {
    it('should delete card successfully', async () => {
      req.params = { cardId: 'card123' };

      const mockResult = { success: true };
      cardService.deleteCard.mockResolvedValue(mockResult);

      await cardController.deleteCard(req, res, next);

      expect(cardService.deleteCard).toHaveBeenCalledWith('card123', 'user123');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should forward errors to error handler', async () => {
      req.params = { cardId: 'card123' };

      cardService.deleteCard.mockRejectedValue(new Error('Card not found'));

      await cardController.deleteCard(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('listCards', () => {
    it('should list cards with filters', async () => {
      req.query = { category: 'Array', difficulty: 'easy', page: '1', limit: '10' };

      const mockCards = [{ _id: 'card1' }, { _id: 'card2' }];
      cardService.listCards.mockResolvedValue(mockCards);

      await cardController.listCards(req, res, next);

      expect(cardService.listCards).toHaveBeenCalledWith('user123', {
        category: 'Array',
        difficulty: 'easy'
      }, { page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith(mockCards);
    });

    it('should handle tags as array', async () => {
      req.query = { tags: ['hashmap', 'two-pointer'] };

      const mockCards = [{ _id: 'card1' }];
      cardService.listCards.mockResolvedValue(mockCards);

      await cardController.listCards(req, res, next);

      expect(cardService.listCards).toHaveBeenCalledWith('user123', {
        tags: ['hashmap', 'two-pointer']
      }, { page: 1, limit: 20 });
    });

    it('should forward errors to error handler', async () => {
      cardService.listCards.mockRejectedValue(new Error('Database error'));

      await cardController.listCards(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('addSolution', () => {
    it('should add solution to card', async () => {
      req.params = { cardId: 'card123' };
      req.body = {
        name: 'New Solution',
        intuition: 'New approach',
        steps: [],
        code: { language: 'js', snippet: 'code' },
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      };

      const mockCard = { _id: 'card123', solutions: [{ name: 'Solution 1' }, { name: 'New Solution' }] };
      cardService.addSolution.mockResolvedValue(mockCard);

      await cardController.addSolution(req, res, next);

      expect(cardService.addSolution).toHaveBeenCalledWith('card123', 'user123', req.body);
      expect(res.json).toHaveBeenCalledWith(mockCard);
    });

    it('should return 400 if name is missing', async () => {
      req.params = { cardId: 'card123' };
      req.body = {
        intuition: 'New approach',
        code: { language: 'js', snippet: 'code' },
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      };

      await cardController.addSolution(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'name, intuition, code, timeComplexity, and spaceComplexity are required'
      });
      expect(cardService.addSolution).not.toHaveBeenCalled();
    });

    it('should forward errors to error handler', async () => {
      req.params = { cardId: 'card123' };
      req.body = {
        name: 'New Solution',
        intuition: 'New approach',
        steps: [],
        code: { language: 'js', snippet: 'code' },
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      };

      cardService.addSolution.mockRejectedValue(new Error('Card not found'));

      await cardController.addSolution(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing steps and default to empty array', async () => {
      req.params = { cardId: 'card123' };
      req.body = {
        name: 'New Solution',
        intuition: 'New approach',
        code: { language: 'js', snippet: 'code' },
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      };

      const mockCard = { _id: 'card123', solutions: [{ name: 'Solution 1' }, { name: 'New Solution' }] };
      cardService.addSolution.mockResolvedValue(mockCard);

      await cardController.addSolution(req, res, next);

      expect(cardService.addSolution).toHaveBeenCalledWith('card123', 'user123', {
        name: 'New Solution',
        intuition: 'New approach',
        steps: [],
        code: { language: 'js', snippet: 'code' },
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      });
    });
  });

  describe('updateSolution', () => {
    it('should update solution at index', async () => {
      req.params = { cardId: 'card123', solutionIndex: '1' };
      req.body = { name: 'Updated' };

      const mockCard = { _id: 'card123', solutions: [{ name: 'Solution 1' }, { name: 'Updated' }] };
      cardService.updateSolution.mockResolvedValue(mockCard);

      await cardController.updateSolution(req, res, next);

      expect(cardService.updateSolution).toHaveBeenCalledWith('card123', 'user123', 1, req.body);
      expect(res.json).toHaveBeenCalledWith(mockCard);
    });

    it('should forward errors to error handler', async () => {
      req.params = { cardId: 'card123', solutionIndex: '1' };
      req.body = { name: 'Updated' };

      cardService.updateSolution.mockRejectedValue(new Error('Invalid solution index'));

      await cardController.updateSolution(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});