const UserProblemState = require('../models/UserProblemState');

class UserProblemStateRepository {
  async create(stateData) {
    const state = new UserProblemState(stateData);
    return await state.save();
  }

  async findByUserAndProblem(userId, problemId) {
    return await UserProblemState.findOne({ userId, problemId });
  }

  async findById(stateId) {
    return await UserProblemState.findById(stateId);
  }

  async findAllByUser(userId, filters = {}, pagination = {}) {
    const query = { userId, ...filters };
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    return await UserProblemState.find(query)
      .populate('problemId')
      .sort({ nextReviewAt: 1 })
      .skip(skip)
      .limit(limit);
  }

  async update(userId, problemId, updates) {
    return await UserProblemState.findOneAndUpdate(
      { userId, problemId },
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  async delete(userId, problemId) {
    return await UserProblemState.findOneAndDelete({ userId, problemId });
  }

  async findDueProblems(userId, now, limit = 10) {
    return await UserProblemState.find({
      userId,
      nextReviewAt: { $lte: now }
    })
    .populate('problemId')
    .sort({ nextReviewAt: 1 })
    .limit(limit);
  }

  async countDueProblems(userId, now) {
    return await UserProblemState.countDocuments({
      userId,
      nextReviewAt: { $lte: now }
    });
  }

  async updateSR(userId, problemId, srFields) {
    return await UserProblemState.findOneAndUpdate(
      { userId, problemId },
      { $set: srFields },
      { new: true }
    );
  }

  async incrementLapse(userId, problemId) {
    return await UserProblemState.findOneAndUpdate(
      { userId, problemId },
      { $inc: { lapseCount: 1 } },
      { new: true }
    );
  }

  async updateRevisionNotes(userId, problemId, notes) {
    return await UserProblemState.findOneAndUpdate(
      { userId, problemId },
      { $set: { revisionNotes: notes } },
      { new: true }
    );
  }

  async findByStatus(userId, status, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    return await UserProblemState.find({ userId, status })
      .populate('problemId')
      .sort({ nextReviewAt: 1 })
      .skip(skip)
      .limit(limit);
  }

  async countByStatus(userId, status) {
    return await UserProblemState.countDocuments({ userId, status });
  }

  async findProblemsInCollection(userId, collectionProblemIds, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    return await UserProblemState.find({
      userId,
      problemId: { $in: collectionProblemIds }
    })
    .populate('problemId')
    .sort({ nextReviewAt: 1 })
    .skip(skip)
    .limit(limit);
  }

  async findDueInCollection(userId, collectionProblemIds, now, limit = 10) {
    return await UserProblemState.find({
      userId,
      problemId: { $in: collectionProblemIds },
      nextReviewAt: { $lte: now }
    })
    .populate('problemId')
    .sort({ nextReviewAt: 1 })
    .limit(limit);
  }

  async countByUser(userId) {
    return await UserProblemState.countDocuments({ userId });
  }
}

module.exports = new UserProblemStateRepository();