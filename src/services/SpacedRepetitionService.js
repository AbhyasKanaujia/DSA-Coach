const { SR } = require('../config/constants');
const DateUtils = require('../utils/dateUtils');

class SpacedRepetitionService {
  reviewCard(card, quality) {
    const qualityScore = SR.QUALITY_MAP[quality];
    if (!qualityScore) {
      throw new Error('Invalid quality. Must be again, hard, or easy');
    }

    let { easeFactor, interval, repetitions, lapseCount } = card;

    if (qualityScore < 3) {
      repetitions = 0;
      interval = 1;
      lapseCount++;
    } else {
      repetitions++;

      easeFactor = easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02));
      easeFactor = Math.max(SR.MIN_EASE_FACTOR, easeFactor);

      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }

    const now = DateUtils.nowUTC();
    const nextReviewAt = DateUtils.addDays(now, interval);

    return {
      easeFactor,
      interval,
      repetitions,
      nextReviewAt,
      lastReviewedAt: now,
      lastResult: quality,
      lapseCount
    };
  }

  initializeSR() {
    const now = DateUtils.nowUTC();
    return {
      easeFactor: SR.DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReviewAt: now,
      lastReviewedAt: null,
      lastResult: null,
      lapseCount: 0
    };
  }
}

module.exports = new SpacedRepetitionService();