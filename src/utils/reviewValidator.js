const mongoose = require('mongoose');
const { ValidationError } = require('./validators');

class ReviewValidator {
  validateReviewSubmission(data) {
    const { problemId, quality, sessionId } = data;

    if (!problemId) {
      throw new ValidationError('Problem ID is required', 'problemId');
    }

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      throw new ValidationError('Invalid problem ID format', 'problemId');
    }

    if (!quality) {
      throw new ValidationError('Quality is required', 'quality');
    }

    const validQualities = ['again', 'hard', 'easy'];
    if (!validQualities.includes(quality)) {
      throw new ValidationError(
        `Quality must be one of: ${validQualities.join(', ')}`,
        'quality'
      );
    }

    if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        throw new ValidationError('Invalid session ID format', 'sessionId');
      }
    }

    return { problemId, quality, sessionId: sessionId || null };
  }
}

module.exports = new ReviewValidator();