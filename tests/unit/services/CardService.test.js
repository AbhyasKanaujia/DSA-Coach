const cardService = require('../../../src/services/CardService');
const cardRepository = require('../../../src/repositories/CardRepository');
const spacedRepetitionService = require('../../../src/services/SpacedRepetitionService');

jest.mock('../../../src/repositories/CardRepository');
jest.mock('../../../src/services/SpacedRepetitionService');

describe('CardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCard', () => {
    const mockUserId = 'user123';
    const mockCardData = {
      questionName: 'Two Sum',
      category: 'Array',
      difficulty: 'easy',
      tags: ['hashmap'],
      solutions: [
        {
          name: 'Brute Force',
          approachOrder: 0,
          intuition: 'Check all pairs',
          steps: ['Iterate', 'Check pairs'],
          code: { language: 'js', snippet: 'code here' },
          timeComplexity: 'O(n²)',
          spaceComplexity: 'O(1)'
        }
      ]
    };

    it('should create card with sorted solutions', async () => {
      const mockSRFields = { easeFactor: 2.5, interval: 0, repetition: 0, dueDate: new Date() };
      spacedRepetitionService.initializeSR.mockReturnValue(mockSRFields);
      cardRepository.create.mockResolvedValue({ _id: 'card123', ...mockCardData, ...mockSRFields });

      const result = await cardService.createCard(mockUserId, mockCardData);

      expect(spacedRepetitionService.initializeSR).toHaveBeenCalled();
      expect(cardRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          solutions: expect.arrayContaining([
            expect.objectContaining({ approachOrder: 0 })
          ])
        })
      );
    });

    it('should throw error if solutions array is empty', async () => {
      await expect(
        cardService.createCard(mockUserId, { ...mockCardData, solutions: [] })
      ).rejects.toThrow('Card must have at least one solution');
    });

    it('should throw error if solutions is missing', async () => {
      await expect(
        cardService.createCard(mockUserId, { ...mockCardData, solutions: undefined })
      ).rejects.toThrow('Card must have at least one solution');
    });

    it('should sort solutions by approachOrder', async () => {
      const unsortedSolutions = [
        { name: 'Optimal', approachOrder: 1, intuition: 'Best', steps: [], code: { language: 'js', snippet: 'code' }, timeComplexity: 'O(n)', spaceComplexity: 'O(n)' },
        { name: 'Brute', approachOrder: 0, intuition: 'Worst', steps: [], code: { language: 'js', snippet: 'code' }, timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' }
      ];

      const mockSRFields = { easeFactor: 2.5, interval: 0, repetition: 0, dueDate: new Date() };
      spacedRepetitionService.initializeSR.mockReturnValue(mockSRFields);
      cardRepository.create.mockResolvedValue({ _id: 'card123' });

      await cardService.createCard(mockUserId, { ...mockCardData, solutions: unsortedSolutions });

      const createCall = cardRepository.create.mock.calls[0][0];
      expect(createCall.solutions[0].name).toBe('Brute');
      expect(createCall.solutions[1].name).toBe('Optimal');
    });

    it('should assign approachOrder by index when not provided', async () => {
      const solutionsWithoutOrder = [
        { name: 'Solution 1', intuition: 'First', steps: [], code: { language: 'js', snippet: 'code' }, timeComplexity: 'O(n)', spaceComplexity: 'O(1)' },
        { name: 'Solution 2', intuition: 'Second', steps: [], code: { language: 'js', snippet: 'code' }, timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' }
      ];

      const mockSRFields = { easeFactor: 2.5, interval: 0, repetition: 0, dueDate: new Date() };
      spacedRepetitionService.initializeSR.mockReturnValue(mockSRFields);
      cardRepository.create.mockResolvedValue({ _id: 'card123' });

      await cardService.createCard(mockUserId, { ...mockCardData, solutions: solutionsWithoutOrder });

      const createCall = cardRepository.create.mock.calls[0][0];
      expect(createCall.solutions[0].approachOrder).toBe(0);
      expect(createCall.solutions[1].approachOrder).toBe(1);
    });
  });

  describe('getCard', () => {
    it('should return card by id', async () => {
      const mockCard = { _id: 'card123', questionName: 'Two Sum' };
      cardRepository.findById.mockResolvedValue(mockCard);

      const result = await cardService.getCard('card123', 'user123');

      expect(cardRepository.findById).toHaveBeenCalledWith('card123', 'user123');
      expect(result).toEqual(mockCard);
    });

    it('should throw error if card not found', async () => {
      cardRepository.findById.mockResolvedValue(null);

      await expect(cardService.getCard('card123', 'user123')).rejects.toThrow('Card not found');
    });
  });

  describe('updateCard', () => {
    it('should update allowed fields only', async () => {
      const mockCard = { _id: 'card123', questionName: 'Updated' };
      cardRepository.update.mockResolvedValue(mockCard);

      const result = await cardService.updateCard('card123', 'user123', {
        questionName: 'Updated',
        easeFactor: 3.0
      });

      expect(cardRepository.update).toHaveBeenCalledWith(
        'card123',
        'user123',
        expect.objectContaining({
          questionName: 'Updated'
        })
      );
      expect(cardRepository.update).not.toHaveBeenCalledWith(
        'card123',
        'user123',
        expect.objectContaining({
          easeFactor: 3.0
        })
      );
    });

    it('should throw error if card not found', async () => {
      cardRepository.update.mockResolvedValue(null);

      await expect(cardService.updateCard('card123', 'user123', { questionName: 'Updated' }))
        .rejects.toThrow('Card not found');
    });

    it('should sort solutions when updating', async () => {
      const mockCard = { _id: 'card123', questionName: 'Updated' };
      cardRepository.update.mockResolvedValue(mockCard);

      const unsortedSolutions = [
        { name: 'Optimal', approachOrder: 1, intuition: 'Best', steps: [], code: { language: 'js', snippet: 'code' }, timeComplexity: 'O(n)', spaceComplexity: 'O(n)' },
        { name: 'Brute', approachOrder: 0, intuition: 'Worst', steps: [], code: { language: 'js', snippet: 'code' }, timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' }
      ];

      await cardService.updateCard('card123', 'user123', { solutions: unsortedSolutions });

      const updateCall = cardRepository.update.mock.calls[0][2];
      expect(updateCall.solutions[0].name).toBe('Brute');
      expect(updateCall.solutions[1].name).toBe('Optimal');
    });
  });

  describe('deleteCard', () => {
    it('should delete card and return success', async () => {
      cardRepository.delete.mockResolvedValue({ _id: 'card123' });

      const result = await cardService.deleteCard('card123', 'user123');

      expect(cardRepository.delete).toHaveBeenCalledWith('card123', 'user123');
      expect(result).toEqual({ success: true });
    });

    it('should throw error if card not found', async () => {
      cardRepository.delete.mockResolvedValue(null);

      await expect(cardService.deleteCard('card123', 'user123')).rejects.toThrow('Card not found');
    });
  });

  describe('listCards', () => {
    it('should list cards with filters', async () => {
      const mockCards = [{ _id: 'card1' }, { _id: 'card2' }];
      cardRepository.findAll.mockResolvedValue(mockCards);

      const result = await cardService.listCards('user123', { category: 'Array' }, { page: 1, limit: 10 });

      expect(cardRepository.findAll).toHaveBeenCalledWith('user123', { category: 'Array' }, { page: 1, limit: 10 });
      expect(result).toEqual(mockCards);
    });

    it('should handle empty filters', async () => {
      const mockCards = [{ _id: 'card1' }];
      cardRepository.findAll.mockResolvedValue(mockCards);

      await cardService.listCards('user123', {}, {});

      expect(cardRepository.findAll).toHaveBeenCalledWith('user123', {}, {});
    });

    it('should use default filters and pagination when not provided', async () => {
      const mockCards = [{ _id: 'card1' }];
      cardRepository.findAll.mockResolvedValue(mockCards);

      await cardService.listCards('user123');

      expect(cardRepository.findAll).toHaveBeenCalledWith('user123', {}, {});
    });

    it('should filter by tags', async () => {
      const mockCards = [{ _id: 'card1' }];
      cardRepository.findAll.mockResolvedValue(mockCards);

      await cardService.listCards('user123', { tags: ['hashmap', 'two-pointer'] }, {});

      expect(cardRepository.findAll).toHaveBeenCalledWith('user123', { tags: { $in: ['hashmap', 'two-pointer'] } }, {});
    });

    it('should not add tags filter when tags array is empty', async () => {
      const mockCards = [{ _id: 'card1' }];
      cardRepository.findAll.mockResolvedValue(mockCards);

      await cardService.listCards('user123', { tags: [] }, {});

      expect(cardRepository.findAll).toHaveBeenCalledWith('user123', {}, {});
    });
  });

  describe('addSolution', () => {
    it('should add solution to card', async () => {
      const mockCard = { _id: 'card123', solutions: [{ name: 'Solution 1' }] };
      cardRepository.findById.mockResolvedValue(mockCard);
      cardRepository.addSolution.mockResolvedValue({ ...mockCard, solutions: [{ name: 'Solution 1' }, { name: 'Solution 2' }] });

      const solution = {
        name: 'Solution 2',
        intuition: 'New approach',
        steps: [],
        code: { language: 'js', snippet: 'code' },
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      };

      const result = await cardService.addSolution('card123', 'user123', solution);

      expect(cardRepository.addSolution).toHaveBeenCalledWith('card123', 'user123', expect.objectContaining({
        name: 'Solution 2',
        approachOrder: 1
      }));
    });

    it('should throw error if card not found', async () => {
      cardRepository.findById.mockResolvedValue(null);

      await expect(cardService.addSolution('card123', 'user123', {})).rejects.toThrow('Card not found');
    });
  });

  describe('updateSolution', () => {
    it('should update solution at index', async () => {
      const mockCard = { _id: 'card123', solutions: [{ name: 'Solution 1' }, { name: 'Solution 2' }] };
      cardRepository.findById.mockResolvedValue(mockCard);
      cardRepository.updateSolution.mockResolvedValue(mockCard);

      await cardService.updateSolution('card123', 'user123', 1, { name: 'Updated' });

      expect(cardRepository.updateSolution).toHaveBeenCalledWith('card123', 'user123', 1, { name: 'Updated' });
    });

    it('should throw error if card not found', async () => {
      cardRepository.findById.mockResolvedValue(null);

      await expect(cardService.updateSolution('card123', 'user123', 0, {})).rejects.toThrow('Card not found');
    });

    it('should throw error for invalid solution index', async () => {
      const mockCard = { _id: 'card123', solutions: [{ name: 'Solution 1' }] };
      cardRepository.findById.mockResolvedValue(mockCard);

      await expect(cardService.updateSolution('card123', 'user123', 5, {})).rejects.toThrow('Invalid solution index');
    });
  });
});