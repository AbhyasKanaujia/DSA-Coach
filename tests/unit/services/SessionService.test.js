const mongoose = require('mongoose');
const sessionService = require('../../../src/services/SessionService');
const userCollectionRepository = require('../../../src/repositories/UserCollectionRepository');
const collectionRepository = require('../../../src/repositories/CollectionRepository');
const userProblemStateRepository = require('../../../src/repositories/UserProblemStateRepository');
const problemRepository = require('../../../src/repositories/ProblemRepository');
const reviewService = require('../../../src/services/ReviewService');

jest.mock('../../../src/repositories/UserCollectionRepository');
jest.mock('../../../src/repositories/CollectionRepository');
jest.mock('../../../src/repositories/UserProblemStateRepository');
jest.mock('../../../src/repositories/ProblemRepository');
jest.mock('../../../src/services/ReviewService');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    it('should return empty result when no active collections', async () => {
      userCollectionRepository.findActiveByUser.mockResolvedValue([]);

      const result = await sessionService.getSession('user123');

      expect(result).toEqual({
        problems: [],
        meta: { dueCount: 0, newCount: 0, total: 0 }
      });
    });

    it('should return empty result when collections have no problems', async () => {
      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: new mongoose.Types.ObjectId() }
      ]);
      collectionRepository.findAll.mockResolvedValue([{ problemIds: [] }]);

      const result = await sessionService.getSession('user123');

      expect(result).toEqual({
        problems: [],
        meta: { dueCount: 0, newCount: 0, total: 0 }
      });
    });

    it('should return due problems sorted by nextReviewAt ASC', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const problemId1 = new mongoose.Types.ObjectId();
      const problemId2 = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000);

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

      const result = await sessionService.getSession(userId.toString());

      expect(result.problems).toHaveLength(2);
      expect(result.problems[0]._id.toString()).toBe(problemId2.toString());
      expect(result.problems[1]._id.toString()).toBe(problemId1.toString());
      expect(result.meta.dueCount).toBe(2);
    });

    it('should return new problems when no due problems exist', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const problemId1 = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const futureDate = new Date(Date.now() + 86400000);

      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: collectionId }
      ]);
      collectionRepository.findAll.mockResolvedValue([
        { problemIds: [problemId1] }
      ]);
      userProblemStateRepository.findByUserAndProblems.mockResolvedValue([]);
      reviewService.startProblem.mockResolvedValue({ status: 'new' });
      problemRepository.findByIds.mockResolvedValue([
        { _id: problemId1, toObject: () => ({ _id: problemId1, title: 'P1' }) }
      ]);

      const result = await sessionService.getSession(userId.toString());

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].userState.status).toBe('new');
      expect(result.meta.newCount).toBe(1);
      expect(result.meta.dueCount).toBe(0);
      expect(reviewService.startProblem).toHaveBeenCalledWith(userId.toString(), problemId1.toString());
    });

    it('should respect limit option', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const problemId1 = new mongoose.Types.ObjectId();
      const problemId2 = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();

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

      const result = await sessionService.getSession(userId.toString(), { limit: 1 });

      expect(result.problems).toHaveLength(1);
    });

    it('should respect maxNew option', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const problemId1 = new mongoose.Types.ObjectId();
      const problemId2 = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      userCollectionRepository.findActiveByUser.mockResolvedValue([
        { collectionId: collectionId }
      ]);
      collectionRepository.findAll.mockResolvedValue([
        { problemIds: [problemId1, problemId2] }
      ]);
      userProblemStateRepository.findByUserAndProblems.mockResolvedValue([]);
      reviewService.startProblem.mockResolvedValue({ status: 'new' });
      problemRepository.findByIds.mockImplementation((ids) =>
        ids.map(id => ({ _id: id, toObject: () => ({ _id: id, title: 'P' }) }))
      );

      const result = await sessionService.getSession(userId.toString(), { limit: 10, maxNew: 1 });

      expect(reviewService.startProblem).toHaveBeenCalledTimes(1);
    });

    it('should prioritize due problems over new problems', async () => {
      const collectionId = new mongoose.Types.ObjectId();
      const dueProblemId = new mongoose.Types.ObjectId();
      const newProblemId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();

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

      const result = await sessionService.getSession(userId.toString(), { limit: 10, maxNew: 5 });

      expect(result.problems[0]._id.toString()).toBe(dueProblemId.toString());
    });

    it('should use default options when none provided', async () => {
      userCollectionRepository.findActiveByUser.mockResolvedValue([]);

      const result = await sessionService.getSession('user123');

      expect(result.meta).toEqual({ dueCount: 0, newCount: 0, total: 0 });
    });
  });
});