const mongoose = require('mongoose');
const { ValidationError } = require('./validators');

class ReviewValidator {
  validateReviewSubmission(data) {
    const { problemId, quality } = data;

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

    return { problemId, quality };
  }
}

module.exports = new ReviewValidator();