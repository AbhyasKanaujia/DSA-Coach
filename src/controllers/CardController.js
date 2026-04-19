const cardService = require('../services/CardService');

class CardController {
  async createCard(req, res, next) {
    try {
      const { questionName, category, difficulty, tags, solutions } = req.body;

      if (!questionName || !category || !difficulty || !solutions) {
        return res.status(400).json({
          error: 'questionName, category, difficulty, and solutions are required'
        });
      }

      const card = await cardService.createCard(req.userId, {
        questionName,
        category,
        difficulty,
        tags,
        solutions
      });

      res.status(201).json(card);
    } catch (error) {
      next(error);
    }
  }

  async getCard(req, res, next) {
    try {
      const { cardId } = req.params;
      const card = await cardService.getCard(cardId, req.userId);
      res.json(card);
    } catch (error) {
      next(error);
    }
  }

  async updateCard(req, res, next) {
    try {
      const { cardId } = req.params;
      const card = await cardService.updateCard(cardId, req.userId, req.body);
      res.json(card);
    } catch (error) {
      next(error);
    }
  }

  async deleteCard(req, res, next) {
    try {
      const { cardId } = req.params;
      const result = await cardService.deleteCard(cardId, req.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async listCards(req, res, next) {
    try {
      const { category, difficulty, tags, page = 1, limit = 20 } = req.query;

      const filters = {};
      if (category) filters.category = category;
      if (difficulty) filters.difficulty = difficulty;
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];

      const pagination = { page: parseInt(page), limit: parseInt(limit) };

      const cards = await cardService.listCards(req.userId, filters, pagination);
      res.json(cards);
    } catch (error) {
      next(error);
    }
  }

  async addSolution(req, res, next) {
    try {
      const { cardId } = req.params;
      const { name, intuition, steps, code, timeComplexity, spaceComplexity } = req.body;

      if (!name || !intuition || !code || !timeComplexity || !spaceComplexity) {
        return res.status(400).json({
          error: 'name, intuition, code, timeComplexity, and spaceComplexity are required'
        });
      }

      const solution = {
        name,
        intuition,
        steps: steps || [],
        code,
        timeComplexity,
        spaceComplexity
      };

      const card = await cardService.addSolution(cardId, req.userId, solution);
      res.json(card);
    } catch (error) {
      next(error);
    }
  }

  async updateSolution(req, res, next) {
    try {
      const { cardId, solutionIndex } = req.params;
      const card = await cardService.updateSolution(
        cardId,
        req.userId,
        parseInt(solutionIndex),
        req.body
      );
      res.json(card);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CardController();