const Problem = require('../models/Problem');

class ProblemRepository {
  async create(problemData) {
    const problem = new Problem(problemData);
    return await problem.save();
  }

  async findById(problemId) {
    return await Problem.findById(problemId);
  }

  async findBySource(source, sourceId) {
    return await Problem.findOne({ source, sourceId });
  }

  async findAll(filters = {}, pagination = {}) {
    const query = { ...filters };
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    return await Problem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async update(problemId, updates) {
    return await Problem.findByIdAndUpdate(
      problemId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  async delete(problemId) {
    return await Problem.findByIdAndDelete(problemId);
  }

  async count(filters = {}) {
    return await Problem.countDocuments(filters);
  }

  async findByIds(problemIds) {
    return await Problem.find({ _id: { $in: problemIds } });
  }
}

module.exports = new ProblemRepository();