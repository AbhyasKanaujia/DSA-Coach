const cardRepository = require('../repositories/CardRepository');
const userService = require('./UserService');
const spacedRepetitionService = require('./SpacedRepetitionService');

class SessionService {
  async getSession(userId, limit = 10) {
    const now = new Date();
    const dueCards = await cardRepository.findDueCards(userId, now, limit);

    return {
      cards: dueCards,
      count: dueCards.length,
      totalDue: await cardRepository.countDueCards(userId, now)
    };
  }

  async submitReview(cardId, userId, quality) {
    const card = await cardRepository.findById(cardId, userId);
    if (!card) {
      throw new Error('Card not found');
    }

    const srUpdates = spacedRepetitionService.reviewCard(card, quality);

    const updatedCard = await cardRepository.updateSR(cardId, userId, srUpdates);

    await userService.updateStatsOnReview(userId);

    return {
      card: updatedCard,
      nextDue: updatedCard.dueDate,
      easeFactor: updatedCard.easeFactor,
      interval: updatedCard.interval
    };
  }
}

module.exports = new SessionService();