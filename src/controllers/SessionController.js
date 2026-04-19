const sessionService = require('../services/SessionService');

class SessionController {
  async getSession(req, res, next) {
    try {
      const { limit } = req.query;
      const session = await sessionService.getSession(req.userId, parseInt(limit) || 10);
      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async submitReview(req, res, next) {
    try {
      const { cardId, quality } = req.body;

      if (!cardId || !quality) {
        return res.status(400).json({ error: 'cardId and quality are required' });
      }

      if (!['easy', 'medium', 'hard'].includes(quality)) {
        return res.status(400).json({ error: 'quality must be easy, medium, or hard' });
      }

      const result = await sessionService.submitReview(cardId, req.userId, quality);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();