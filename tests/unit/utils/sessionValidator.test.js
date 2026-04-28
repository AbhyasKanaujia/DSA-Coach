const sessionValidator = require('../../../src/utils/sessionValidator');
const { ValidationError } = require('../../../src/utils/validators');

describe('SessionValidator', () => {
  describe('validateStartSession', () => {
    it('should return undefined when no options provided so service can apply user preference', () => {
      const result = sessionValidator.validateStartSession();
      expect(result).toEqual({ limit: undefined, maxNew: undefined });
    });

    it('should return undefined when empty object provided so service can apply user preference', () => {
      const result = sessionValidator.validateStartSession({});
      expect(result).toEqual({ limit: undefined, maxNew: undefined });
    });

    it('should accept valid limit', () => {
      const result = sessionValidator.validateStartSession({ limit: 5 });
      expect(result.limit).toBe(5);
      expect(result.maxNew).toBeUndefined();
    });

    it('should accept valid maxNew', () => {
      const result = sessionValidator.validateStartSession({ maxNew: 10 });
      expect(result.limit).toBeUndefined();
      expect(result.maxNew).toBe(10);
    });

    it('should throw ValidationError for limit below 1', () => {
      expect(() => sessionValidator.validateStartSession({ limit: 0 })).toThrow(ValidationError);
    });

    it('should throw ValidationError for limit above 50', () => {
      expect(() => sessionValidator.validateStartSession({ limit: 51 })).toThrow(ValidationError);
    });

    it('should throw ValidationError for maxNew below 0', () => {
      expect(() => sessionValidator.validateStartSession({ maxNew: -1 })).toThrow(ValidationError);
    });

    it('should throw ValidationError for maxNew above 20', () => {
      expect(() => sessionValidator.validateStartSession({ maxNew: 21 })).toThrow(ValidationError);
    });

    it('should accept limit of 1 (minimum)', () => {
      expect(sessionValidator.validateStartSession({ limit: 1 }).limit).toBe(1);
    });

    it('should accept limit of 50 (maximum)', () => {
      expect(sessionValidator.validateStartSession({ limit: 50 }).limit).toBe(50);
    });

    it('should accept maxNew of 0', () => {
      expect(sessionValidator.validateStartSession({ maxNew: 0 }).maxNew).toBe(0);
    });

    it('should throw ValidationError for non-numeric limit', () => {
      expect(() => sessionValidator.validateStartSession({ limit: 'abc' })).toThrow(ValidationError);
    });
  });

  describe('validateSessionId', () => {
    it('should accept valid ObjectId', () => {
      const id = new (require('mongoose').Types.ObjectId)();
      expect(sessionValidator.validateSessionId(id.toString())).toBe(id.toString());
    });

    it('should throw ValidationError for invalid ObjectId', () => {
      expect(() => sessionValidator.validateSessionId('invalid')).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => sessionValidator.validateSessionId('')).toThrow(ValidationError);
    });
  });

  describe('validateListSessions', () => {
    it('should return defaults when no query provided', () => {
      const result = sessionValidator.validateListSessions();
      expect(result).toEqual({ page: 1, limit: 20, status: null });
    });

    it('should accept valid page and limit', () => {
      const result = sessionValidator.validateListSessions({ page: 2, limit: 10 });
      expect(result).toEqual({ page: 2, limit: 10, status: null });
    });

    it('should accept valid status filter', () => {
      const result = sessionValidator.validateListSessions({ status: 'completed' });
      expect(result.status).toBe('completed');
    });

    it('should throw ValidationError for invalid page', () => {
      expect(() => sessionValidator.validateListSessions({ page: 0 })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid limit', () => {
      expect(() => sessionValidator.validateListSessions({ limit: 51 })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid status', () => {
      expect(() => sessionValidator.validateListSessions({ status: 'invalid' })).toThrow(ValidationError);
    });
  });
});