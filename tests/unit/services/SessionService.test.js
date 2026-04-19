const sessionService = require('../../../src/services/SessionService');
const cardRepository = require('../../../src/repositories/CardRepository');
const userService = require('../../../src/services/UserService');
const spacedRepetitionService = require('../../../src/services/SpacedRepetitionService');

jest.mock('../../../src/repositories/CardRepository');
jest.mock('../../../src/services/UserService');
jest.mock('../../../src/services/SpacedRepetitionService');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    it('should get session with default limit of 10', async () => {
      const mockCards = [{ _id: 'card1' }, { _id: 'card2' }];
      cardRepository.findDueCards.mockResolvedValue(mockCards);
      cardRepository.countDueCards.mockResolvedValue(2);

      const result = await sessionService.getSession('user123');

      expect(cardRepository.findDueCards).toHaveBeenCalledWith('user123', expect.any(Date), 10);
      expect(cardRepository.countDueCards).toHaveBeenCalledWith('user123', expect.any(Date));
      expect(result).toEqual({
        cards: mockCards,
        count: 2,
        totalDue: 2
      });
    });

    it('should get session with custom limit', async () => {
      const mockCards = [{ _id: 'card1' }];
      cardRepository.findDueCards.mockResolvedValue(mockCards);
      cardRepository.countDueCards.mockResolvedValue(1);

      const result = await sessionService.getSession('user123', 5);

      expect(cardRepository.findDueCards).toHaveBeenCalledWith('user123', expect.any(Date), 5);
      expect(result).toEqual({
        cards: mockCards,
        count: 1,
        totalDue: 1
      });
    });
  });

  describe('submitReview', () => {
    it('should submit review and update stats', async () => {
      const mockCard = {
        _id: 'card123',
        easeFactor: 2.5,
        interval: 0,
        repetition: 0
      };

      const mockSRUpdates = {
        easeFactor: 2.6,
        interval: 1,
        repetition: 1,
        dueDate: new Date(),
        lastReviewed: new Date(),
        lastQuality: 5
      };

      const mockUpdatedCard = { ...mockCard, ...mockSRUpdates };

      cardRepository.findById.mockResolvedValue(mockCard);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      cardRepository.updateSR.mockResolvedValue(mockUpdatedCard);
      userService.updateStatsOnReview.mockResolvedValue({ totalReviews: 1, streak: 1 });

      const result = await sessionService.submitReview('card123', 'user123', 'easy');

      expect(spacedRepetitionService.reviewCard).toHaveBeenCalledWith(mockCard, 'easy');
      expect(cardRepository.updateSR).toHaveBeenCalledWith('card123', 'user123', mockSRUpdates);
      expect(userService.updateStatsOnReview).toHaveBeenCalledWith('user123');
      expect(result).toEqual({
        card: mockUpdatedCard,
        nextDue: mockUpdatedCard.dueDate,
        easeFactor: mockUpdatedCard.easeFactor,
        interval: mockUpdatedCard.interval
      });
    });

    it('should throw error if card not found', async () => {
      cardRepository.findById.mockResolvedValue(null);

      await expect(
        sessionService.submitReview('card123', 'user123', 'easy')
      ).rejects.toThrow('Card not found');
    });
  });
});