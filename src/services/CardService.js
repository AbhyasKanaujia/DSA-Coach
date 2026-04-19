const cardRepository = require('../repositories/CardRepository');
const spacedRepetitionService = require('./SpacedRepetitionService');

class CardService {
  async createCard(userId, data) {
    const { questionName, category, difficulty, tags, solutions } = data;

    if (!solutions || solutions.length === 0) {
      throw new Error('Card must have at least one solution');
    }

    const sortedSolutions = solutions
      .map((sol, idx) => ({
        ...sol,
        approachOrder: sol.approachOrder !== undefined ? sol.approachOrder : idx
      }))
      .sort((a, b) => a.approachOrder - b.approachOrder);

    const srFields = spacedRepetitionService.initializeSR();

    /* istanbul ignore next */
    const cardData = {
      userId,
      questionName,
      category,
      difficulty,
      tags: tags || [],
      solutions: sortedSolutions,
      selectedSolutionIndex: 0,
      revisionNotes: null,
      ...srFields
    };

    return await cardRepository.create(cardData);
  }

  async getCard(cardId, userId) {
    const card = await cardRepository.findById(cardId, userId);
    if (!card) {
      throw new Error('Card not found');
    }
    return card;
  }

  async updateCard(cardId, userId, updates) {
    const allowedFields = ['questionName', 'category', 'difficulty', 'tags', 'solutions', 'selectedSolutionIndex', 'revisionNotes'];
    const filteredUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'solutions') {
          /* istanbul ignore next */
          filteredUpdates[field] = updates[field]
            .map((sol, idx) => ({
              ...sol,
              approachOrder: sol.approachOrder !== undefined ? sol.approachOrder : idx
            }))
            .sort((a, b) => a.approachOrder - b.approachOrder);
        } else {
          filteredUpdates[field] = updates[field];
        }
      }
    }

    const card = await cardRepository.update(cardId, userId, filteredUpdates);
    if (!card) {
      throw new Error('Card not found');
    }
    return card;
  }

  async deleteCard(cardId, userId) {
    const card = await cardRepository.delete(cardId, userId);
    if (!card) {
      throw new Error('Card not found');
    }
    return { success: true };
  }

  async listCards(userId, filters = {}, pagination = {}) {
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.difficulty) query.difficulty = filters.difficulty;
    if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags };

    return await cardRepository.findAll(userId, query, pagination);
  }

  async addSolution(cardId, userId, solution) {
    const card = await cardRepository.findById(cardId, userId);
    if (!card) {
      throw new Error('Card not found');
    }

    const newSolution = {
      ...solution,
      approachOrder: card.solutions.length
    };

    return await cardRepository.addSolution(cardId, userId, newSolution);
  }

  async updateSolution(cardId, userId, solutionIndex, updates) {
    const card = await cardRepository.findById(cardId, userId);
    if (!card) {
      throw new Error('Card not found');
    }

    if (solutionIndex < 0 || solutionIndex >= card.solutions.length) {
      throw new Error('Invalid solution index');
    }

    return await cardRepository.updateSolution(cardId, userId, solutionIndex, updates);
  }
}

module.exports = new CardService();