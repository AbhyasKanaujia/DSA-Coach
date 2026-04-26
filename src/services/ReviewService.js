const userProblemStateRepository = require('../repositories/UserProblemStateRepository');
const attemptRepository = require('../repositories/AttemptRepository');
const sessionRepository = require('../repositories/SessionRepository');
const spacedRepetitionService = require('./SpacedRepetitionService');
const statsService = require('./StatsService');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/validators');
const { SESSION } = require('../config/constants');

class ReviewService {
  async submitReview(userId, problemId, quality, sessionId = null) {
    if (sessionId) {
      const session = await sessionRepository.findById(sessionId);
      if (!session) {
        throw new NotFoundError('Session');
      }
      if (session.userId.toString() !== userId.toString()) {
        throw new ConflictError('Session does not belong to this user');
      }
      if (session.status !== SESSION.STATUS.ACTIVE) {
        throw new ConflictError('Session is not active');
      }
      const queued = session.queuedProblemIds.map(id => id.toString());
      if (!queued.includes(problemId.toString())) {
        throw new ValidationError('Problem is not in this session', 'problemId');
      }
    }

    const state = await userProblemStateRepository.findByUserAndProblem(userId, problemId);
    if (!state) {
      throw new NotFoundError('User problem state');
    }

    const previousStatus = state.status;

    const srUpdates = spacedRepetitionService.reviewCard(state, quality);

    const updatedState = await userProblemStateRepository.updateSR(
      userId,
      problemId,
      srUpdates
    );

    const attempt = await attemptRepository.create({
      userId,
      sessionId: sessionId || null,
      problemId,
      quality,
      previousStatus,
      newStatus: srUpdates.status
    });

    if (sessionId) {
      await sessionRepository.addAttemptedProblem(sessionId, problemId);

      const updatedSession = await sessionRepository.findById(sessionId);
      const attemptedSet = new Set(updatedSession.attemptedProblemIds.map(id => id.toString()));
      const allAttempted = updatedSession.queuedProblemIds.every(id => attemptedSet.has(id.toString()));
      if (allAttempted) {
        await sessionRepository.updateStatus(sessionId, SESSION.STATUS.COMPLETED, new Date());
      }
    }

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
      status: updatedState.status,
      attemptId: attempt._id
    };
  }
}

module.exports = new ReviewService();