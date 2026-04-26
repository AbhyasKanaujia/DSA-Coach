const sessionService = require('../services/SessionService');
const sessionValidator = require('../utils/sessionValidator');

class SessionController {
  async startSession(req, res, next) {
    try {
      const options = sessionValidator.validateStartSession(req.body);
      const session = await sessionService.startSession(req.userId, options);
      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async getSession(req, res, next) {
    try {
      const sessionId = sessionValidator.validateSessionId(req.params.sessionId);
      const session = await sessionService.getSession(sessionId, req.userId);
      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async completeSession(req, res, next) {
    try {
      const sessionId = sessionValidator.validateSessionId(req.params.sessionId);
      const session = await sessionService.completeSession(sessionId, req.userId);
      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async abandonSession(req, res, next) {
    try {
      const sessionId = sessionValidator.validateSessionId(req.params.sessionId);
      const session = await sessionService.abandonSession(sessionId, req.userId);
      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async listSessions(req, res, next) {
    try {
      const { page, limit, status } = sessionValidator.validateListSessions(req.query);
      const sessions = await sessionService.listSessions(req.userId, { page, limit });
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();