const sessionValidator = require('../../../src/utils/sessionValidator');
const { ValidationError } = require('../../../src/utils/validators');

describe('SessionValidator', () => {
  describe('validateStartSession', () => {
    it('should return defaults when no options provided', () => {
      const result = sessionValidator.validateStartSession();
      expect(result).toEqual({ limit: 10, maxNew: 3 });
    });

    it('should return defaults when empty object provided', () => {
      const result = sessionValidator.validateStartSession({});
      expect(result).toEqual({ limit: 10, maxNew: 3 });
    });

    it('should accept valid limit', () => {
      const result = sessionValidator.validateStartSession({ limit: 5 });
      expect(result.limit).toBe(5);
      expect(result.maxNew).toBe(3);
    });

    it('should accept valid maxNew', () => {
      const result = sessionValidator.validateStartSession({ maxNew: 10 });
      expect(result.limit).toBe(10);
      expect(result.maxNew).toBe(10);
    });

    it('should accept both valid limit and maxNew', () => {
      const result = sessionValidator.validateStartSession({ limit: 20, maxNew: 5 });
      expect(result).toEqual({ limit: 20, maxNew: 5 });
    });

    it('should throw ValidationError for limit below 1', () => {
      expect(() => {
        sessionValidator.validateStartSession({ limit: 0 });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for limit above 50', () => {
      expect(() => {
        sessionValidator.validateStartSession({ limit: 51 });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for maxNew below 0', () => {
      expect(() => {
        sessionValidator.validateStartSession({ maxNew: -1 });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for maxNew above 20', () => {
      expect(() => {
        sessionValidator.validateStartSession({ maxNew: 21 });
      }).toThrow(ValidationError);
    });

    it('should accept limit of 1 (minimum)', () => {
      const result = sessionValidator.validateStartSession({ limit: 1 });
      expect(result.limit).toBe(1);
    });

    it('should accept limit of 50 (maximum)', () => {
      const result = sessionValidator.validateStartSession({ limit: 50 });
      expect(result.limit).toBe(50);
    });

    it('should accept maxNew of 0', () => {
      const result = sessionValidator.validateStartSession({ maxNew: 0 });
      expect(result.maxNew).toBe(0);
    });

    it('should accept maxNew of 20 (maximum)', () => {
      const result = sessionValidator.validateStartSession({ maxNew: 20 });
      expect(result.maxNew).toBe(20);
    });

    it('should throw ValidationError for non-numeric limit', () => {
      expect(() => {
        sessionValidator.validateStartSession({ limit: 'abc' });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-numeric maxNew', () => {
      expect(() => {
        sessionValidator.validateStartSession({ maxNew: 'abc' });
      }).toThrow(ValidationError);
    });
  });
});