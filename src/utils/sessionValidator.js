const { ValidationError, validators } = require('./validators');

class SessionValidator {
  validateStartSession(options = {}) {
    const { limit, maxNew } = options;

    if (limit !== undefined) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 50) {
        throw new ValidationError('Session limit must be between 1 and 50', 'limit');
      }
    }

    if (maxNew !== undefined) {
      const parsed = parseInt(maxNew, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > 20) {
        throw new ValidationError('maxNew must be between 0 and 20', 'maxNew');
      }
    }

    return {
      limit: limit !== undefined ? parseInt(limit, 10) : 10,
      maxNew: maxNew !== undefined ? parseInt(maxNew, 10) : 3
    };
  }
}

module.exports = new SessionValidator();