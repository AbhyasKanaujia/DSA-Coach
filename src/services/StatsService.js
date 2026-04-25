const userRepository = require('../repositories/UserRepository');
const { NotFoundError } = require('../utils/validators');
const DateUtils = require('../utils/dateUtils');

class StatsService {
  async incrementReviewCount(userId) {
    const updatedUser = await userRepository.incrementTotalReviews(userId);
    return updatedUser.stats;
  }

  async updateStreak(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const today = DateUtils.nowUTCMidnight();
    const lastActive = user.stats.lastActiveDate;

    let streakIncrement = 0;

    if (!lastActive) {
      streakIncrement = 1;
    } else {
      const diffDays = DateUtils.diffDays(today, lastActive);
      if (diffDays === 0) {
        streakIncrement = 0;
      } else if (diffDays === 1) {
        streakIncrement = 1;
      } else {
        streakIncrement = 1;
      }
    }

    const updatedUser = await userRepository.updateStreak(userId, streakIncrement);
    return updatedUser.stats;
  }

  async getUserStats(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user.stats;
  }

  async updateStatsOnReview(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const today = DateUtils.nowUTCMidnight();
    const lastActive = user.stats.lastActiveDate;

    let streakIncrement = 0;

    if (!lastActive) {
      streakIncrement = 1;
    } else {
      const diffDays = DateUtils.diffDays(today, lastActive);
      if (diffDays === 0) {
        streakIncrement = 0;
      } else if (diffDays === 1) {
        streakIncrement = 1;
      } else {
        streakIncrement = 1;
      }
    }

    const updatedUser = await userRepository.incrementReviewAndUpdateStreak(userId, streakIncrement);
    return updatedUser.stats;
  }
}

module.exports = new StatsService();