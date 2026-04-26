const mongoose = require('mongoose');
const sessionService = require('../../../src/services/SessionService');
const userCollectionRepository = require('../../../src/repositories/UserCollectionRepository');
const collectionRepository = require('../../../src/repositories/CollectionRepository');
const userProblemStateRepository = require('../../../src/repositories/UserProblemStateRepository');
const problemRepository = require('../../../src/repositories/ProblemRepository');
const userRepository = require('../../../src/repositories/UserRepository');
const sessionRepository = require('../../../src/repositories/SessionRepository');
const spacedRepetitionService = require('../../../src/services/SpacedRepetitionService');
const { NotFoundError, ConflictError } = require('../../../src/utils/validators');

jest.mock('../../../src/repositories/UserCollectionRepository');
jest.mock('../../../src/repositories/CollectionRepository');
jest.mock('../../../src/repositories/UserProblemStateRepository');
jest.mock('../../../src/repositories/ProblemRepository');
jest.mock('../../../src/repositories/UserRepository');
jest.mock('../../../src/repositories/SessionRepository');
jest.mock('../../../src/services/SpacedRepetitionService');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should return empty session when no active collections', async () => {
      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 10 } });
      sessionRepository.findActiveByUser.mockResolvedValue(null);
      sessionRepository.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'active',
        config: { limit: 10, maxNew: 3 },
        meta: { dueCount: 0, newCount: 0, totalAvailable: 0 }
      });
      userCollectionRepository.findActiveByUser.mockResolvedValue([]);

      const result = await sessionService.startSession('user123');

      expect(result.problems).toEqual([]);
      expect(result.sessionId).toBeDefined();
      expect(result.status).toBe('active');
      expect(result.meta.queuedCount).toBe(0);
    });

    it('should return empty session when collections have no problems', async () => {
      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 10 } });
      sessionRepository.findActiveByUser.mockResolvedValue(null);
      sessionRepository.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'active',
        config: { limit: 10, maxNew: 3 },
        meta: { dueCount: 0, newCount: 0, totalAvailable: 0 }
      });
      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: new mongoose.Types.ObjectId() }
      ]);
      collectionRepository.findAll.mockResolvedValue([{ problemIds: [] }]);

      const result = await sessionService.startSession('user123');

      expect(result.problems).toEqual([]);
      expect(result.meta.queuedCount).toBe(0);
    });

    it('should abandon prior active session before creating new one', async () => {
      const activeSession = { _id: new mongoose.Types.ObjectId(), status: 'active' };
      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 10 } });
      sessionRepository.findActiveByUser.mockResolvedValue(activeSession);
      sessionRepository.updateStatus.mockResolvedValue({ ...activeSession, status: 'abandoned' });
      sessionRepository.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'active',
        config: { limit: 10, maxNew: 3 },
        meta: { dueCount: 0, newCount: 0, totalAvailable: 0 }
      });
      userCollectionRepository.findActiveByUser.mockResolvedValue([]);

      await sessionService.startSession('user123');

      expect(sessionRepository.updateStatus).toHaveBeenCalledWith(
        activeSession._id,
        'abandoned',
        expect.any(Date)
      );
    });

    it('should return due problems sorted by nextReviewAt ASC', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const problemId1 = new mongoose.Types.ObjectId();
      const problemId2 = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const sessionId = new mongoose.Types.ObjectId();

      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000);

      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 10 } });
      sessionRepository.findActiveByUser.mockResolvedValue(null);
      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: collectionId }
      ]);
      collectionRepository.findAll.mockResolvedValue([
        { problemIds: [problemId1, problemId2] }
      ]);
      userProblemStateRepository.findByUserAndProblems.mockResolvedValue([
        { problemId: problemId1, nextReviewAt: now, status: 'review' },
        { problemId: problemId2, nextReviewAt: earlier, status: 'review' }
      ]);
      problemRepository.findByIds.mockResolvedValue([
        { _id: problemId1, toObject: () => ({ _id: problemId1, title: 'P1' }) },
        { _id: problemId2, toObject: () => ({ _id: problemId2, title: 'P2' }) }
      ]);
      sessionRepository.create.mockResolvedValue({
        _id: sessionId,
        status: 'active',
        config: { limit: 10, maxNew: 3 },
        meta: { dueCount: 2, newCount: 0, totalAvailable: 2 }
      });

      const result = await sessionService.startSession(userId.toString());

      expect(result.problems).toHaveLength(2);
      expect(result.problems[0]._id.toString()).toBe(problemId2.toString());
      expect(result.problems[1]._id.toString()).toBe(problemId1.toString());
      expect(result.meta.dueCount).toBe(2);
      expect(result.sessionId).toBeDefined();
    });

    it('should initialize UserProblemState for new problems via upsert', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const problemId1 = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 10 } });
      sessionRepository.findActiveByUser.mockResolvedValue(null);
      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: collectionId }
      ]);
      collectionRepository.findAll.mockResolvedValue([
        { problemIds: [problemId1] }
      ]);
      userProblemStateRepository.findByUserAndProblems.mockResolvedValue([]);
      spacedRepetitionService.initializeSR.mockReturnValue({
        easeFactor: 2.5, interval: 0, repetitions: 0,
        nextReviewAt: new Date(), lastReviewedAt: null, lastResult: null, lapseCount: 0
      });
      userProblemStateRepository.upsert.mockResolvedValue({ status: 'new' });
      problemRepository.findByIds.mockResolvedValue([
        { _id: problemId1, toObject: () => ({ _id: problemId1, title: 'P1' }) }
      ]);
      sessionRepository.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'active',
        config: { limit: 10, maxNew: 3 },
        meta: { dueCount: 0, newCount: 1, totalAvailable: 1 }
      });

      const result = await sessionService.startSession(userId.toString());

      expect(userProblemStateRepository.upsert).toHaveBeenCalledWith(
        userId.toString(), problemId1.toString(),
        expect.objectContaining({ status: 'new', userId: userId.toString(), problemId: problemId1.toString() })
      );
      expect(result.problems).toHaveLength(1);
    });

    it('should respect limit option', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const problemId1 = new mongoose.Types.ObjectId();
      const problemId2 = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();

      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 10 } });
      sessionRepository.findActiveByUser.mockResolvedValue(null);
      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: collectionId }
      ]);
      collectionRepository.findAll.mockResolvedValue([
        { problemIds: [problemId1, problemId2] }
      ]);
      userProblemStateRepository.findByUserAndProblems.mockResolvedValue([
        { problemId: problemId1, nextReviewAt: now, status: 'review' },
        { problemId: problemId2, nextReviewAt: now, status: 'review' }
      ]);
      problemRepository.findByIds.mockResolvedValue([
        { _id: problemId1, toObject: () => ({ _id: problemId1, title: 'P1' }) }
      ]);
      sessionRepository.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'active',
        config: { limit: 1, maxNew: 3 },
        meta: { dueCount: 2, newCount: 0, totalAvailable: 2 }
      });

      const result = await sessionService.startSession(userId.toString(), { limit: 1 });

      expect(result.problems).toHaveLength(1);
    });

    it('should respect maxNew option', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const problemId1 = new mongoose.Types.ObjectId();
      const problemId2 = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 10 } });
      sessionRepository.findActiveByUser.mockResolvedValue(null);
      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: collectionId }
      ]);
      collectionRepository.findAll.mockResolvedValue([
        { problemIds: [problemId1, problemId2] }
      ]);
      userProblemStateRepository.findByUserAndProblems.mockResolvedValue([]);
      spacedRepetitionService.initializeSR.mockReturnValue({
        easeFactor: 2.5, interval: 0, repetitions: 0,
        nextReviewAt: new Date(), lastReviewedAt: null, lastResult: null, lapseCount: 0
      });
      userProblemStateRepository.upsert.mockResolvedValue({ status: 'new' });
      problemRepository.findByIds.mockImplementation((ids) =>
        ids.map(id => ({ _id: id, toObject: () => ({ _id: id, title: 'P' }) }))
      );
      sessionRepository.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'active',
        config: { limit: 10, maxNew: 1 },
        meta: { dueCount: 0, newCount: 2, totalAvailable: 2 }
      });

      const result = await sessionService.startSession(userId.toString(), { limit: 10, maxNew: 1 });

      expect(userProblemStateRepository.upsert).toHaveBeenCalledTimes(1);
    });

    it('should prioritize due problems over new problems', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const dueProblemId = new mongoose.Types.ObjectId();
      const newProblemId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();

      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 10 } });
      sessionRepository.findActiveByUser.mockResolvedValue(null);
      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: collectionId }
      ]);
      collectionRepository.findAll.mockResolvedValue([
        { problemIds: [dueProblemId, newProblemId] }
      ]);
      userProblemStateRepository.findByUserAndProblems.mockResolvedValue([
        { problemId: dueProblemId, nextReviewAt: now, status: 'review' }
      ]);
      problemRepository.findByIds.mockResolvedValue([
        { _id: dueProblemId, toObject: () => ({ _id: dueProblemId, title: 'Due' }) },
        { _id: newProblemId, toObject: () => ({ _id: newProblemId, title: 'New' }) }
      ]);
      sessionRepository.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: 'active',
        config: { limit: 10, maxNew: 5 },
        meta: { dueCount: 1, newCount: 1, totalAvailable: 2 }
      });

      const result = await sessionService.startSession(userId.toString(), { limit: 10, maxNew: 5 });

      expect(result.problems[0]._id.toString()).toBe(dueProblemId.toString());
    });

    it('should use user maxSessionSize preference as fallback', async () => {
      userRepository.findById.mockResolvedValue({ preferences: { maxSessionSize: 7 } });
      sessionRepository.findActiveByUser.mockResolvedValue(null);
      sessionRepository.create.mockImplementation(async (data) => ({
        _id: new mongoose.Types.ObjectId(),
        ...data
      }));
      userCollectionRepository.findActiveByUser.mockResolvedValue([]);

      const result = await sessionService.startSession('user123');

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          config: { limit: 7, maxNew: 3 }
        })
      );
    });
  });

  describe('getSession', () => {
    it('should return session for valid owner', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const session = { _id: sessionId, userId, status: 'active' };
      sessionRepository.findById.mockResolvedValue(session);

      const result = await sessionService.getSession(sessionId, userId);

      expect(result).toEqual(session);
    });

    it('should throw NotFoundError if session does not belong to user', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      sessionRepository.findById.mockResolvedValue({ _id: sessionId, userId: otherUserId });

      await expect(sessionService.getSession(sessionId, userId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if session does not exist', async () => {
      sessionRepository.findById.mockResolvedValue(null);

      await expect(sessionService.getSession('nonexistent', 'user123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('completeSession', () => {
    it('should complete an active session', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const session = { _id: sessionId, userId, status: 'active' };
      sessionRepository.findById.mockResolvedValue(session);
      sessionRepository.updateStatus.mockResolvedValue({ ...session, status: 'completed' });

      const result = await sessionService.completeSession(sessionId, userId);

      expect(sessionRepository.updateStatus).toHaveBeenCalledWith(sessionId, 'completed', expect.any(Date));
      expect(result.status).toBe('completed');
    });

    it('should throw ConflictError if session is not active', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      sessionRepository.findById.mockResolvedValue({ _id: sessionId, userId, status: 'completed' });

      await expect(sessionService.completeSession(sessionId, userId)).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError if session does not belong to user', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      sessionRepository.findById.mockResolvedValue({ userId: otherUserId, status: 'active' });

      await expect(sessionService.completeSession('sid', 'user123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('abandonSession', () => {
    it('should abandon an active session', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const session = { _id: sessionId, userId, status: 'active' };
      sessionRepository.findById.mockResolvedValue(session);
      sessionRepository.updateStatus.mockResolvedValue({ ...session, status: 'abandoned' });

      const result = await sessionService.abandonSession(sessionId, userId);

      expect(sessionRepository.updateStatus).toHaveBeenCalledWith(sessionId, 'abandoned', expect.any(Date));
      expect(result.status).toBe('abandoned');
    });

    it('should throw ConflictError if session is not active', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      sessionRepository.findById.mockResolvedValue({ _id: sessionId, userId, status: 'completed' });

      await expect(sessionService.abandonSession(sessionId, userId)).rejects.toThrow(ConflictError);
    });
  });

  describe('listSessions', () => {
    it('should return paginated session list', async () => {
      const sessions = [{ _id: 's1' }, { _id: 's2' }];
      sessionRepository.findByUser.mockResolvedValue(sessions);

      const result = await sessionService.listSessions('user123', { page: 1, limit: 20 });

      expect(result).toEqual(sessions);
      expect(sessionRepository.findByUser).toHaveBeenCalledWith('user123', { page: 1, limit: 20 });
    });
  });
});