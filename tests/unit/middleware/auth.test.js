const jwt = require('jsonwebtoken');
const auth = require('../../../src/middleware/auth');

jest.mock('jsonwebtoken');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('token validation', () => {
    it('should pass valid token and set req.userId and req.email', () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'user123', email: 'test@example.com' };

      req.header.mockReturnValue(`Bearer ${mockToken}`);
      jwt.verify.mockReturnValue(mockDecoded);

      auth(req, res, next);

      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(req.userId).toBe('user123');
      expect(req.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', () => {
      req.header.mockReturnValue(undefined);

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      const mockToken = 'invalid-token';

      req.header.mockReturnValue(`Bearer ${mockToken}`);
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'user123', email: 'test@example.com' };

      req.header.mockReturnValue(mockToken);
      jwt.verify.mockReturnValue(mockDecoded);

      auth(req, res, next);

      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(req.userId).toBe('user123');
      expect(req.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should handle empty Authorization header', () => {
      req.header.mockReturnValue('');

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});