const Attempt = require('../models/Attempt');

class AttemptRepository {
  async create(attemptData) {
    const attempt = new Attempt(attemptData);
    return await attempt.save();
  }

  async findBySession(sessionId) {
    return await Attempt.find({ sessionId }).sort({ createdAt: 1 });
  }

  async findByUserAndProblem(userId, problemId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    return await Attempt.find({ userId, problemId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async countByUserAndProblem(userId, problemId) {
    return await Attempt.countDocuments({ userId, problemId });
  }

  async countBySession(sessionId) {
    return await Attempt.countDocuments({ sessionId });
  }

  async findByUserAndSession(userId, sessionId) {
    return await Attempt.find({ userId, sessionId }).sort({ createdAt: 1 });
  }
}

module.exports = new AttemptRepository();