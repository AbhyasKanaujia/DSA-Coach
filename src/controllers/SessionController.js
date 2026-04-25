const sessionService = require('../services/SessionService');
const sessionValidator = require('../utils/sessionValidator');

class SessionController {
  async startSession(req, res, next) {
    try {
      const options = sessionValidator.validateStartSession(req.body);
      const session = await sessionService.getSession(req.userId, options);
      res.json(session);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();