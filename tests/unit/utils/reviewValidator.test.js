const reviewValidator = require('../../../src/utils/reviewValidator');
const { ValidationError } = require('../../../src/utils/validators');

describe('ReviewValidator', () => {
  describe('validateReviewSubmission', () => {
    it('should pass with valid data', () => {
      const result = reviewValidator.validateReviewSubmission({
        problemId: '507f1f77bcf86cd799439011',
        quality: 'easy'
      });
      expect(result).toEqual({ problemId: '507f1f77bcf86cd799439011', quality: 'easy' });
    });

    it('should throw ValidationError when problemId is missing', () => {
      expect(() => {
        reviewValidator.validateReviewSubmission({ quality: 'easy' });
      }).toThrow(ValidationError);
      try {
        reviewValidator.validateReviewSubmission({ quality: 'easy' });
      } catch (error) {
        expect(error.field).toBe('problemId');
      }
    });

    it('should throw ValidationError when problemId is invalid ObjectId', () => {
      expect(() => {
        reviewValidator.validateReviewSubmission({ problemId: 'invalid', quality: 'easy' });
      }).toThrow(ValidationError);
      try {
        reviewValidator.validateReviewSubmission({ problemId: 'invalid', quality: 'easy' });
      } catch (error) {
        expect(error.field).toBe('problemId');
      }
    });

    it('should throw ValidationError when quality is missing', () => {
      expect(() => {
        reviewValidator.validateReviewSubmission({ problemId: '507f1f77bcf86cd799439011' });
      }).toThrow(ValidationError);
      try {
        reviewValidator.validateReviewSubmission({ problemId: '507f1f77bcf86cd799439011' });
      } catch (error) {
        expect(error.field).toBe('quality');
      }
    });

    it('should throw ValidationError when quality is invalid', () => {
      expect(() => {
        reviewValidator.validateReviewSubmission({ problemId: '507f1f77bcf86cd799439011', quality: 'medium' });
      }).toThrow(ValidationError);
      try {
        reviewValidator.validateReviewSubmission({ problemId: '507f1f77bcf86cd799439011', quality: 'medium' });
      } catch (error) {
        expect(error.field).toBe('quality');
      }
    });

    it('should accept all valid quality values', () => {
      for (const quality of ['again', 'hard', 'easy']) {
        const result = reviewValidator.validateReviewSubmission({
          problemId: '507f1f77bcf86cd799439011',
          quality
        });
        expect(result.quality).toBe(quality);
      }
    });
  });
});