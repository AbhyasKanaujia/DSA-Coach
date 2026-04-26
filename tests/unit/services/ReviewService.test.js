const mongoose = require('mongoose');
const reviewService = require('../../../src/services/ReviewService');
const userProblemStateRepository = require('../../../src/repositories/UserProblemStateRepository');
const attemptRepository = require('../../../src/repositories/AttemptRepository');
const sessionRepository = require('../../../src/repositories/SessionRepository');
const spacedRepetitionService = require('../../../src/services/SpacedRepetitionService');
const statsService = require('../../../src/services/StatsService');
const { NotFoundError, ConflictError, ValidationError } = require('../../../src/utils/validators');

jest.mock('../../../src/repositories/UserProblemStateRepository');
jest.mock('../../../src/repositories/AttemptRepository');
jest.mock('../../../src/repositories/SessionRepository');
jest.mock('../../../src/services/SpacedRepetitionService');
jest.mock('../../../src/services/StatsService');

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitReview', () => {
    it('should submit review without sessionId and create attempt', async () => {
      const mockState = { _id: 'state123', easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const mockSRUpdates = {
        easeFactor: 2.6, interval: 1, repetitions: 1,
        nextReviewAt: new Date(), lastReviewedAt: new Date(),
        lastResult: 'easy', lapseCount: 0, status: 'learning'
      };
      const mockUpdatedState = { ...mockState, ...mockSRUpdates };
      const mockAttempt = { _id: 'attempt123' };

      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(mockState);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      userProblemStateRepository.updateSR.mockResolvedValue(mockUpdatedState);
      attemptRepository.create.mockResolvedValue(mockAttempt);
      statsService.updateStatsOnReview.mockResolvedValue({ totalReviews: 1, streak: 1 });

      const result = await reviewService.submitReview('user123', 'problem123', 'easy');

      expect(spacedRepetitionService.reviewCard).toHaveBeenCalledWith(mockState, 'easy');
      expect(userProblemStateRepository.updateSR).toHaveBeenCalledWith('user123', 'problem123', mockSRUpdates);
      expect(attemptRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user123',
        sessionId: null,
        problemId: 'problem123',
        quality: 'easy',
        previousStatus: 'new',
        newStatus: 'learning'
      }));
      expect(statsService.updateStatsOnReview).toHaveBeenCalledWith('user123');
      expect(result.attemptId).toBe('attempt123');
    });

    it('should submit review with sessionId and validate session', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = new mongoose.Types.ObjectId();
      const problemId = new mongoose.Types.ObjectId();
      const anotherProblemId = new mongoose.Types.ObjectId();
      const mockState = { _id: 'state123', easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const mockSRUpdates = {
        easeFactor: 2.6, interval: 1, repetitions: 1,
        nextReviewAt: new Date(), lastReviewedAt: new Date(),
        lastResult: 'easy', lapseCount: 0, status: 'learning'
      };
      const mockUpdatedState = { ...mockState, ...mockSRUpdates };
      const mockAttempt = { _id: 'attempt123' };

      // Session has 2 problems so it won't auto-complete after 1 review
      sessionRepository.findById
        .mockResolvedValueOnce({
          _id: sessionId, userId, status: 'active',
          queuedProblemIds: [problemId, anotherProblemId],
          attemptedProblemIds: []
        })
        .mockResolvedValueOnce({
          _id: sessionId, userId, status: 'active',
          queuedProblemIds: [problemId, anotherProblemId],
          attemptedProblemIds: [problemId]
        });
      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(mockState);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      userProblemStateRepository.updateSR.mockResolvedValue(mockUpdatedState);
      attemptRepository.create.mockResolvedValue(mockAttempt);
      sessionRepository.addAttemptedProblem.mockResolvedValue({
        _id: sessionId, queuedProblemIds: [problemId, anotherProblemId], attemptedProblemIds: [problemId]
      });
      statsService.updateStatsOnReview.mockResolvedValue({});

      const result = await reviewService.submitReview(userId.toString(), problemId.toString(), 'easy', sessionId.toString());

      expect(sessionRepository.addAttemptedProblem).toHaveBeenCalledWith(sessionId.toString(), problemId.toString());
      expect(result.attemptId).toBe('attempt123');
    });

    it('should throw NotFoundError if session not found', async () => {
      sessionRepository.findById.mockResolvedValue(null);

      await expect(
        reviewService.submitReview('user123', 'problem123', 'easy', 'badSessionId')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if session does not belong to user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      sessionRepository.findById.mockResolvedValue({
        _id: 'sessionId', userId: otherUserId, status: 'active'
      });

      await expect(
        reviewService.submitReview(userId.toString(), 'problem123', 'easy', 'sessionId')
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if session is not active', async () => {
      const userId = new mongoose.Types.ObjectId();
      sessionRepository.findById.mockResolvedValue({
        _id: 'sessionId', userId, status: 'completed'
      });

      await expect(
        reviewService.submitReview(userId.toString(), 'problem123', 'easy', 'sessionId')
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if problem not in session', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = new mongoose.Types.ObjectId();
      const problemId = new mongoose.Types.ObjectId();
      const otherProblemId = new mongoose.Types.ObjectId();
      sessionRepository.findById.mockResolvedValue({
        _id: sessionId, userId, status: 'active',
        queuedProblemIds: [otherProblemId]
      });

      await expect(
        reviewService.submitReview(userId.toString(), problemId.toString(), 'easy', sessionId.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if problem state not found', async () => {
      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(null);

      await expect(
        reviewService.submitReview('user123', 'problem123', 'easy')
      ).rejects.toThrow('User problem state not found');
    });

    it('should continue if stats update fails', async () => {
      const mockState = { _id: 'state123', easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const mockSRUpdates = {
        easeFactor: 2.6, interval: 1, repetitions: 1, status: 'learning',
        nextReviewAt: new Date(), lastReviewedAt: new Date(), lastResult: 'easy', lapseCount: 0
      };
      const mockUpdatedState = { ...mockState, ...mockSRUpdates };

      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(mockState);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      userProblemStateRepository.updateSR.mockResolvedValue(mockUpdatedState);
      attemptRepository.create.mockResolvedValue({ _id: 'attempt123' });
      statsService.updateStatsOnReview.mockRejectedValue(new Error('Stats update failed'));

      const result = await reviewService.submitReview('user123', 'problem123', 'easy');

      expect(result.state).toEqual(mockUpdatedState);
    });

    it('should auto-complete session when all queued problems attempted', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = new mongoose.Types.ObjectId();
      const problemId = new mongoose.Types.ObjectId();
      const mockState = { _id: 'state123', easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const mockSRUpdates = {
        easeFactor: 2.6, interval: 1, repetitions: 1,
        nextReviewAt: new Date(), lastReviewedAt: new Date(),
        lastResult: 'easy', lapseCount: 0, status: 'learning'
      };
      const mockUpdatedState = { ...mockState, ...mockSRUpdates };

      // First call: session validation; Second call: after addAttemptedProblem (all attempted)
      sessionRepository.findById
        .mockResolvedValueOnce({
          _id: sessionId, userId, status: 'active',
          queuedProblemIds: [problemId],
          attemptedProblemIds: []
        })
        .mockResolvedValueOnce({
          _id: sessionId, userId, status: 'active',
          queuedProblemIds: [problemId],
          attemptedProblemIds: [problemId]
        });
      userProblemStateRepository.findByUserAndProblem.mockResolvedValue(mockState);
      spacedRepetitionService.reviewCard.mockReturnValue(mockSRUpdates);
      userProblemStateRepository.updateSR.mockResolvedValue(mockUpdatedState);
      attemptRepository.create.mockResolvedValue({ _id: 'attempt123' });
      sessionRepository.addAttemptedProblem.mockResolvedValue({
        _id: sessionId, queuedProblemIds: [problemId], attemptedProblemIds: [problemId]
      });
      sessionRepository.updateStatus.mockResolvedValue({ status: 'completed' });
      statsService.updateStatsOnReview.mockResolvedValue({});

      await reviewService.submitReview(userId.toString(), problemId.toString(), 'easy', sessionId.toString());

      expect(sessionRepository.updateStatus).toHaveBeenCalledWith(sessionId.toString(), 'completed', expect.any(Date));
    });
  });
});