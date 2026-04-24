const ProblemContent = require('../models/ProblemContent');

class ProblemContentRepository {
  async create(contentData) {
    const content = new ProblemContent(contentData);
    return await content.save();
  }

  async findByProblemId(problemId) {
    return await ProblemContent.findOne({ problemId });
  }

  async findById(contentId) {
    return await ProblemContent.findById(contentId);
  }

  async update(problemId, updates) {
    return await ProblemContent.findOneAndUpdate(
      { problemId },
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  async delete(problemId) {
    return await ProblemContent.findOneAndDelete({ problemId });
  }

  async incrementVersion(problemId) {
    return await ProblemContent.findOneAndUpdate(
      { problemId },
      { $inc: { version: 1 } },
      { new: true }
    );
  }
}

module.exports = new ProblemContentRepository();