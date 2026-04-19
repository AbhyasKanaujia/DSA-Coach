const { SR } = require('../config/constants');

class SpacedRepetitionService {
  reviewCard(card, quality) {
    const qualityScore = SR.QUALITY_MAP[quality];
    if (!qualityScore) {
      throw new Error('Invalid quality. Must be easy, medium, or hard');
    }

    let { easeFactor, interval, repetition, lapseCount } = card;

    if (qualityScore < 3) {
      repetition = 0;
      interval = 1;
      lapseCount++;
    } else {
      repetition++;

      easeFactor = easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02));
      easeFactor = Math.max(SR.MIN_EASE_FACTOR, easeFactor);

      if (repetition === 1) {
        interval = 1;
      } else if (repetition === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + interval);

    return {
      easeFactor,
      interval,
      repetition,
      dueDate,
      lastReviewed: now,
      lastQuality: qualityScore,
      lapseCount
    };
  }

  initializeSR() {
    const now = new Date();
    return {
      easeFactor: SR.DEFAULT_EASE_FACTOR,
      interval: 0,
      repetition: 0,
      dueDate: now,
      lastReviewed: null,
      lastQuality: null,
      lapseCount: 0
    };
  }
}

module.exports = new SpacedRepetitionService();