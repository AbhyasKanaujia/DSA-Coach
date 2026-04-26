const Session = require('../models/Session');

class SessionRepository {
  async create(sessionData) {
    const session = new Session(sessionData);
    return await session.save();
  }

  async findById(sessionId) {
    return await Session.findById(sessionId);
  }

  async findActiveByUser(userId) {
    return await Session.findOne({ userId, status: 'active' });
  }

  async findByUser(userId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    return await Session.find({ userId })
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async updateStatus(sessionId, status, completedAt) {
    const update = { status };
    if (completedAt) {
      update.completedAt = completedAt;
    }
    return await Session.findOneAndUpdate(
      { _id: sessionId, status: 'active' },
      { $set: update },
      { new: true }
    );
  }

  async addAttemptedProblem(sessionId, problemId) {
    return await Session.findByIdAndUpdate(
      sessionId,
      { $addToSet: { attemptedProblemIds: problemId } },
      { new: true }
    );
  }

  async countByUserAndStatus(userId, status) {
    return await Session.countDocuments({ userId, status });
  }
}

module.exports = new SessionRepository();