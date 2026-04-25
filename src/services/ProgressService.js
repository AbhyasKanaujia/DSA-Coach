const userRepository = require('../repositories/UserRepository');
const userProblemStateRepository = require('../repositories/UserProblemStateRepository');
const { NotFoundError } = require('../utils/validators');

class ProgressService {
  async getUserProgress(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const statusCounts = await userProblemStateRepository.countGroupByStatus(userId);

    const masteryBreakdown = { new: 0, learning: 0, review: 0, mastered: 0 };
    for (const { _id, count } of statusCounts) {
      if (_id && masteryBreakdown.hasOwnProperty(_id)) {
        masteryBreakdown[_id] = count;
      }
    }

    return {
      totalSolved: Object.values(masteryBreakdown).reduce((sum, c) => sum + c, 0),
      totalReviewed: user.stats.totalReviews,
      streak: user.stats.streak,
      lastActiveDate: user.stats.lastActiveDate,
      masteryBreakdown
    };
  }
}

module.exports = new ProgressService();