const reviewService = require('../../../src/services/ReviewService');
const userProblemStateRepository = require('../../../src/repositories/UserProblemStateRepository');
const spacedRepetitionService = require('../../../src/services/SpacedRepetitionService');
const statsService = require('../../../src/services/StatsService');

jest.mock('../../../src/repositories/UserProblemStateRepository');
jest.mock('../../../src/services/SpacedRepetitionService');
jest.mock('../../../src/services/StatsService');

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitReview', () => {
    it('should submit review and update state with status', async () => {
      const mockState = {
        _id: 'state123',
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        status: 'new'
      };

      const mockSRUpdates = {
        easeFactor: 2.6,
        interval: 1,
        repetitions: 1,
        nextReviewAt: new Date(),
        lastReviewedAt: new Date(),
        lastResult: 'easy',
        lapseCount: 0,
        status: 'learning'
      };

      const mockUpdatedState = { ...mockState, ...mockSRUpdates };

      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(mockState);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      userProblemStateRepository.updateSR.mockResolvedValue(mockUpdatedState);
      statsService.updateStatsOnReview.mockResolvedValue({ totalReviews: 1, streak: 1 });

      const result = await reviewService.submitReview('user123', 'problem123', 'easy');

      expect(spacedRepetitionService.reviewCard).toHaveBeenCalledWith(mockState, 'easy');
      expect(userProblemStateRepository.updateSR).toHaveBeenCalledWith('user123', 'problem123', mockSRUpdates);
      expect(statsService.updateStatsOnReview).toHaveBeenCalledWith('user123');
      expect(result).toEqual({
        state: mockUpdatedState,
        nextDue: mockUpdatedState.nextReviewAt,
        easeFactor: mockUpdatedState.easeFactor,
        interval: mockUpdatedState.interval,
        status: mockUpdatedState.status
      });
    });

    it('should throw NotFoundError if problem state not found', async () => {
      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(null);

      await expect(
        reviewService.submitReview('user123', 'problem123', 'easy')
      ).rejects.toThrow('User problem state not found');
    });

    it('should continue if stats update fails', async () => {
      const mockState = { _id: 'state123', easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const mockSRUpdates = { easeFactor: 2.6, interval: 1, repetitions: 1, status: 'learning', nextReviewAt: new Date(), lastReviewedAt: new Date(), lastResult: 'easy', lapseCount: 0 };
      const mockUpdatedState = { ...mockState, ...mockSRUpdates };

      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(mockState);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      userProblemStateRepository.updateSR.mockResolvedValue(mockUpdatedState);
      statsService.updateStatsOnReview.mockRejectedValue(new Error('Stats update failed'));

      const result = await reviewService.submitReview('user123', 'problem123', 'easy');

      expect(result.state).toEqual(mockUpdatedState);
    });
  });

  describe('startProblem', () => {
    it('should return existing state if one already exists', async () => {
      const existingState = { _id: 'state123', userId: 'user123', problemId: 'problem123', status: 'learning' };
      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(existingState);

      const result = await reviewService.startProblem('user123', 'problem123');

      expect(result).toEqual(existingState);
      expect(userProblemStateRepository.create).not.toHaveBeenCalled();
    });

    it('should create new state with SRS defaults if none exists', async () => {
      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(null);
      spacedRepetitionService.initializeSR.mockReturnValue({
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewAt: new Date(),
        lastReviewedAt: null,
        lastResult: null,
        lapseCount: 0
      });
      const newState = { _id: 'state456', userId: 'user123', problemId: 'problem123', status: 'new' };
      userProblemStateRepository.create.mockResolvedValue(newState);

      const result = await reviewService.startProblem('user123', 'problem123');

      expect(userProblemStateRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          problemId: 'problem123',
          status: 'new'
        })
      );
      expect(result).toEqual(newState);
    });
  });
});