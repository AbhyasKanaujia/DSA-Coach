const progressService = require('../services/ProgressService');

class ProgressController {
  async getProgress(req, res, next) {
    try {
      const progress = await progressService.getUserProgress(req.userId);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProgressController();