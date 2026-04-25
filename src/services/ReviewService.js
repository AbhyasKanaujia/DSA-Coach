const userProblemStateRepository = require('../repositories/UserProblemStateRepository');
const spacedRepetitionService = require('./SpacedRepetitionService');
const statsService = require('./StatsService');
const { NotFoundError } = require('../utils/validators');

class ReviewService {
  async submitReview(userId, problemId, quality) {
    const state = await userProblemStateRepository.findByUserAndProblem(userId, problemId);
    if (!state) {
      throw new NotFoundError('User problem state');
    }

    const srUpdates = spacedRepetitionService.reviewCard(state, quality);

    const updatedState = await userProblemStateRepository.updateSR(
      userId,
      problemId,
      srUpdates
    );

    try {
      await statsService.updateStatsOnReview(userId);
    } catch (error) {
      console.error('Failed to update stats on review:', error);
    }

    return {
      state: updatedState,
      nextDue: updatedState.nextReviewAt,
      easeFactor: updatedState.easeFactor,
      interval: updatedState.interval,
      status: updatedState.status
    };
  }

  async startProblem(userId, problemId) {
    const existing = await userProblemStateRepository.findByUserAndProblem(userId, problemId);
    if (existing) {
      return existing;
    }

    const srInit = spacedRepetitionService.initializeSR();
    const newState = await userProblemStateRepository.create({
      userId,
      problemId,
      status: 'new',
      ...srInit
    });

    return newState;
  }
}

module.exports = new ReviewService();