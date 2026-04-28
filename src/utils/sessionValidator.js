const mongoose = require('mongoose');
const { ValidationError } = require('./validators');
const { SR, SESSION } = require('../config/constants');

class SessionValidator {
  validateStartSession(options = {}) {
    const { limit, maxNew } = options;

    if (limit !== undefined) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > SR.MAX_SESSION_SIZE) {
        throw new ValidationError(`Session limit must be between 1 and ${SR.MAX_SESSION_SIZE}`, 'limit');
      }
    }

    if (maxNew !== undefined) {
      const parsed = parseInt(maxNew, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > SR.MAX_NEW_PER_SESSION) {
        throw new ValidationError(`maxNew must be between 0 and ${SR.MAX_NEW_PER_SESSION}`, 'maxNew');
      }
    }

    return {
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
      maxNew: maxNew !== undefined ? parseInt(maxNew, 10) : undefined
    };
  }

  validateSessionId(sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ValidationError('Invalid session ID format', 'sessionId');
    }
    return sessionId;
  }

  validateListSessions(query = {}) {
    const { page, limit, status } = query;

    const parsedPage = page !== undefined ? parseInt(page, 10) : 1;
    if (isNaN(parsedPage) || parsedPage < 1) {
      throw new ValidationError('Page must be a positive integer', 'page');
    }

    const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 20;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      throw new ValidationError('Limit must be between 1 and 50', 'limit');
    }

    if (status !== undefined && status !== null) {
      const validStatuses = Object.values(SESSION.STATUS);
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`, 'status');
      }
    }

    return { page: parsedPage, limit: parsedLimit, status: status || null };
  }
}

module.exports = new SessionValidator();