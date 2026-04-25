const userProblemStateRepository = require('../repositories/UserProblemStateRepository');
const userCollectionRepository = require('../repositories/UserCollectionRepository');
const collectionRepository = require('../repositories/CollectionRepository');
const problemRepository = require('../repositories/ProblemRepository');
const reviewService = require('./ReviewService');
const DateUtils = require('../utils/dateUtils');

class SessionService {
  async getSession(userId, options = {}) {
    const { limit = 10, maxNew = 3 } = options;

    const activeUserCollections = await userCollectionRepository.findActiveByUser(userId);
    if (!activeUserCollections || activeUserCollections.length === 0) {
      return {
        problems: [],
        meta: { dueCount: 0, newCount: 0, total: 0 }
      };
    }

    const collectionIds = activeUserCollections.map(uc => {
      const id = uc.collectionId;
      return typeof id === 'object' && id._id ? id._id : id;
    });

    const collections = await collectionRepository.findAll({ _id: { $in: collectionIds } });
    const allProblemIds = [...new Set(
      collections.flatMap(c => (c.problemIds || []).map(id => id.toString()))
    )];

    if (allProblemIds.length === 0) {
      return {
        problems: [],
        meta: { dueCount: 0, newCount: 0, total: 0 }
      };
    }

    const existingStates = await userProblemStateRepository.findByUserAndProblems(
      userId,
      allProblemIds
    );

    const stateMap = new Map();
    for (const state of existingStates) {
      stateMap.set(state.problemId.toString(), state);
    }

    const now = DateUtils.nowUTC();

    const dueProblemIds = [];
    const newProblemIds = [];

    for (const pid of allProblemIds) {
      const state = stateMap.get(pid);
      if (state) {
        if (state.nextReviewAt && new Date(state.nextReviewAt) <= now) {
          dueProblemIds.push(pid);
        }
      } else {
        newProblemIds.push(pid);
      }
    }

    dueProblemIds.sort((a, b) => {
      const stateA = stateMap.get(a);
      const stateB = stateMap.get(b);
      return new Date(stateA.nextReviewAt) - new Date(stateB.nextReviewAt);
    });

    const selectedDue = dueProblemIds.slice(0, limit);
    const remainingSlots = limit - selectedDue.length;
    const selectedNew = newProblemIds.slice(0, Math.min(remainingSlots, maxNew));

    const selectedIds = [...selectedDue, ...selectedNew];

    if (selectedIds.length === 0) {
      return {
        problems: [],
        meta: {
          dueCount: dueProblemIds.length,
          newCount: newProblemIds.length,
          total: dueProblemIds.length + newProblemIds.length
        }
      };
    }

    const newStatePromises = selectedNew.map(pid =>
      reviewService.startProblem(userId, pid)
    );
    await Promise.all(newStatePromises);

    const problems = await problemRepository.findByIds(selectedIds);

    const problemMap = new Map();
    for (const p of problems) {
      problemMap.set(p._id.toString(), p);
    }

    const orderedProblems = selectedIds
      .map(id => problemMap.get(id))
      .filter(Boolean);

    const enrichedProblems = orderedProblems.map(problem => {
      const state = stateMap.get(problem._id.toString()) || { status: 'new' };
      return {
        ...(problem.toObject ? problem.toObject() : problem),
        userState: {
          status: state.status,
          nextReviewAt: state.nextReviewAt,
          lastReviewedAt: state.lastReviewedAt,
          easeFactor: state.easeFactor,
          interval: state.interval
        }
      };
    });

    return {
      problems: enrichedProblems,
      meta: {
        dueCount: dueProblemIds.length,
        newCount: newProblemIds.length,
        total: dueProblemIds.length + newProblemIds.length
      }
    };
  }
}

module.exports = new SessionService();