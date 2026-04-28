const userProblemStateRepository = require('../repositories/UserProblemStateRepository');
const userCollectionRepository = require('../repositories/UserCollectionRepository');
const collectionRepository = require('../repositories/CollectionRepository');
const problemRepository = require('../repositories/ProblemRepository');
const userRepository = require('../repositories/UserRepository');
const sessionRepository = require('../repositories/SessionRepository');
const spacedRepetitionService = require('./SpacedRepetitionService');
const DateUtils = require('../utils/dateUtils');
const { SR, SESSION } = require('../config/constants');
const { NotFoundError, ConflictError } = require('../utils/validators');

class SessionService {
  async startSession(userId, options = {}) {
    const activeSession = await sessionRepository.findActiveByUser(userId);
    if (activeSession) {
      await sessionRepository.updateStatus(activeSession._id, SESSION.STATUS.ABANDONED, new Date());
    }

    const user = await userRepository.findById(userId);
    const userPreferredLimit = user && user.preferences ? user.preferences.maxSessionSize : undefined;
    const effectiveLimit = options.limit ?? userPreferredLimit ?? SR.DEFAULT_SESSION_SIZE;
    const effectiveMaxNew = options.maxNew ?? SR.DEFAULT_MAX_NEW;

    const activeUserCollections = await userCollectionRepository.findActiveByUser(userId);
    if (!activeUserCollections || activeUserCollections.length === 0) {
      const session = await sessionRepository.create({
        userId,
        status: SESSION.STATUS.ACTIVE,
        queuedProblemIds: [],
        attemptedProblemIds: [],
        config: { limit: effectiveLimit, maxNew: effectiveMaxNew },
        meta: { dueCount: 0, newCount: 0, totalAvailable: 0 },
        startedAt: new Date()
      });
      return {
        sessionId: session._id,
        status: session.status,
        problems: [],
        config: session.config,
        meta: { ...session.meta, queuedCount: 0, attemptedCount: 0 }
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
      const session = await sessionRepository.create({
        userId,
        status: SESSION.STATUS.ACTIVE,
        queuedProblemIds: [],
        attemptedProblemIds: [],
        config: { limit: effectiveLimit, maxNew: effectiveMaxNew },
        meta: { dueCount: 0, newCount: 0, totalAvailable: 0 },
        startedAt: new Date()
      });
      return {
        sessionId: session._id,
        status: session.status,
        problems: [],
        config: session.config,
        meta: { ...session.meta, queuedCount: 0, attemptedCount: 0 }
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

    const selectedDue = dueProblemIds.slice(0, effectiveLimit);
    const remainingSlots = effectiveLimit - selectedDue.length;
    const selectedNew = newProblemIds.slice(0, Math.min(remainingSlots, effectiveMaxNew));

    const selectedIds = [...selectedDue, ...selectedNew];

    if (selectedIds.length > 0) {
      const initPromises = selectedNew.map(pid => {
        const srInit = spacedRepetitionService.initializeSR();
        return userProblemStateRepository.upsert(userId, pid, {
          userId,
          problemId: pid,
          status: 'new',
          ...srInit
        });
      });
      await Promise.all(initPromises);
    }

    const session = await sessionRepository.create({
      userId,
      status: SESSION.STATUS.ACTIVE,
      queuedProblemIds: selectedIds,
      attemptedProblemIds: [],
      config: { limit: effectiveLimit, maxNew: effectiveMaxNew },
      meta: {
        dueCount: dueProblemIds.length,
        newCount: newProblemIds.length,
        totalAvailable: dueProblemIds.length + newProblemIds.length
      },
      startedAt: new Date()
    });

    if (selectedIds.length === 0) {
      return {
        sessionId: session._id,
        status: session.status,
        problems: [],
        config: session.config,
        meta: { ...session.meta, queuedCount: 0, attemptedCount: 0 }
      };
    }

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
      sessionId: session._id,
      status: session.status,
      problems: enrichedProblems,
      config: session.config,
      meta: {
        ...session.meta,
        queuedCount: selectedIds.length,
        attemptedCount: 0
      }
    };
  }

  async getSession(sessionId, userId) {
    const session = await sessionRepository.findById(sessionId);
    if (!session || session.userId.toString() !== userId.toString()) {
      throw new NotFoundError('Session');
    }
    return session;
  }

  async completeSession(sessionId, userId) {
    const session = await sessionRepository.findById(sessionId);
    if (!session || session.userId.toString() !== userId.toString()) {
      throw new NotFoundError('Session');
    }
    if (session.status !== SESSION.STATUS.ACTIVE) {
      throw new ConflictError('Session is not active');
    }
    return await sessionRepository.updateStatus(sessionId, SESSION.STATUS.COMPLETED, new Date());
  }

  async abandonSession(sessionId, userId) {
    const session = await sessionRepository.findById(sessionId);
    if (!session || session.userId.toString() !== userId.toString()) {
      throw new NotFoundError('Session');
    }
    if (session.status !== SESSION.STATUS.ACTIVE) {
      throw new ConflictError('Session is not active');
    }
    return await sessionRepository.updateStatus(sessionId, SESSION.STATUS.ABANDONED, new Date());
  }

  async listSessions(userId, pagination = {}) {
    return await sessionRepository.findByUser(userId, pagination);
  }
}

module.exports = new SessionService();