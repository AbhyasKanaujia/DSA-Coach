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
      const { problemId, quality } = req.body;

      if (!problemId || !quality) {
        return res.status(400).json({ error: 'problemId and quality are required' });
      }

      if (!['again', 'hard', 'easy'].includes(quality)) {
        return res.status(400).json({ error: 'quality must be again, hard, or easy' });
      }

      const result = await sessionService.submitReview(problemId, req.userId, quality);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();