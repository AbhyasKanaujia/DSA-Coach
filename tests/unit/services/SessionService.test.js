const sessionService = require('../../../src/services/SessionService');
const userProblemStateRepository = require('../../../src/repositories/UserProblemStateRepository');
const statsService = require('../../../src/services/StatsService');
const spacedRepetitionService = require('../../../src/services/SpacedRepetitionService');

jest.mock('../../../src/repositories/UserProblemStateRepository');
jest.mock('../../../src/services/StatsService');
jest.mock('../../../src/services/SpacedRepetitionService');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    it('should get session with default limit of 10', async () => {
      const mockProblems = [{ _id: 'problem1' }, { _id: 'problem2' }];
      userProblemStateRepository.findDueProblems.mockResolvedValue(mockProblems);
      userProblemStateRepository.countDueProblems.mockResolvedValue(2);

      const result = await sessionService.getSession('user123');

      expect(userProblemStateRepository.findDueProblems).toHaveBeenCalledWith('user123', expect.any(Date), 10);
      expect(userProblemStateRepository.countDueProblems).toHaveBeenCalledWith('user123', expect.any(Date));
      expect(result).toEqual({
        problems: mockProblems,
        count: 2,
        totalDue: 2
      });
    });

    it('should get session with custom limit', async () => {
      const mockProblems = [{ _id: 'problem1' }];
      userProblemStateRepository.findDueProblems.mockResolvedValue(mockProblems);
      userProblemStateRepository.countDueProblems.mockResolvedValue(1);

      const result = await sessionService.getSession('user123', 5);

      expect(userProblemStateRepository.findDueProblems).toHaveBeenCalledWith('user123', expect.any(Date), 5);
      expect(result).toEqual({
        problems: mockProblems,
        count: 1,
        totalDue: 1
      });
    });
  });

  describe('submitReview', () => {
    it('should submit review and update stats', async () => {
      const mockState = {
        _id: 'state123',
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0
      };

      const mockSRUpdates = {
        easeFactor: 2.6,
        interval: 1,
        repetitions: 1,
        nextReviewAt: new Date(),
        lastReviewedAt: new Date(),
        lastResult: 'easy'
      };

      const mockUpdatedState = { ...mockState, ...mockSRUpdates };

      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(mockState);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      userProblemStateRepository.updateSR.mockResolvedValue(mockUpdatedState);
      statsService.updateStatsOnReview.mockResolvedValue({ totalReviews: 1, streak: 1 });

      const result = await sessionService.submitReview('problem123', 'user123', 'easy');

      expect(spacedRepetitionService.reviewCard).toHaveBeenCalledWith(mockState, 'easy');
      expect(userProblemStateRepository.updateSR).toHaveBeenCalledWith('user123', 'problem123', mockSRUpdates);
      expect(statsService.updateStatsOnReview).toHaveBeenCalledWith('user123');
      expect(result).toEqual({
        state: mockUpdatedState,
        nextDue: mockUpdatedState.nextReviewAt,
        easeFactor: mockUpdatedState.easeFactor,
        interval: mockUpdatedState.interval
      });
    });

    it('should submit review with again quality', async () => {
      const mockState = { _id: 'state123', easeFactor: 2.5, interval: 6, repetitions: 3 };
      const mockSRUpdates = {
        easeFactor: 2.3,
        interval: 1,
        repetitions: 0,
        nextReviewAt: new Date(),
        lastReviewedAt: new Date(),
        lastResult: 'again'
      };
      const mockUpdatedState = { ...mockState, ...mockSRUpdates };

      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(mockState);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      userProblemStateRepository.updateSR.mockResolvedValue(mockUpdatedState);
      statsService.updateStatsOnReview.mockResolvedValue({ totalReviews: 1, streak: 1 });

      const result = await sessionService.submitReview('problem123', 'user123', 'again');

      expect(spacedRepetitionService.reviewCard).toHaveBeenCalledWith(mockState, 'again');
      expect(result.state.lastResult).toBe('again');
    });

    it('should throw error if problem state not found', async () => {
      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(null);

      await expect(
        sessionService.submitReview('problem123', 'user123', 'easy')
      ).rejects.toThrow('Problem state not found');
    });
  });
});