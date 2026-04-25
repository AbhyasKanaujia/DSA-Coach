const reviewService = require('../services/ReviewService');
const reviewValidator = require('../utils/reviewValidator');

class ReviewController {
  async submitReview(req, res, next) {
    try {
      const { problemId, quality } = reviewValidator.validateReviewSubmission(req.body);
      const result = await reviewService.submitReview(req.userId, problemId, quality);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();