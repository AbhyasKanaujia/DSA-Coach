const errorHandler = require('../../../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('ValidationError', () => {
    it('should return 400 with validation error details', () => {
      const err = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is required' },
          password: { message: 'Password is required' }
        }
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        details: ['Email is required', 'Password is required']
      });
    });
  });

  describe('CastError', () => {
    it('should return 400 for invalid ID format', () => {
      const err = {
        name: 'CastError',
        message: 'Cast to ObjectId failed'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
    });
  });

  describe('Duplicate entry', () => {
    it('should return 409 for duplicate entry code', () => {
      const err = {
        code: 11000,
        message: 'Duplicate key error'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate entry' });
    });
  });

  describe('Custom error messages', () => {
    it('should return 409 for Email already registered', () => {
      const err = {
        message: 'Email already registered'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate entry' });
    });

    it('should return 401 for Invalid credentials', () => {
      const err = {
        message: 'Invalid credentials'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 401 for No token provided', () => {
      const err = {
        message: 'No token provided'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should return 401 for Invalid token', () => {
      const err = {
        message: 'Invalid token'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should return 404 for Card not found', () => {
      const err = {
        message: 'Card not found'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Card not found' });
    });

    it('should return 404 for User not found', () => {
      const err = {
        message: 'User not found'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('Default error handling', () => {
    it('should return 500 for unknown errors', () => {
      const err = {
        message: 'Something went wrong'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Something went wrong' });
    });

    it('should return custom status if provided', () => {
      const err = {
        status: 418,
        message: 'I\'m a teapot'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({ error: 'I\'m a teapot' });
    });

    it('should return 500 with default message if no message provided', () => {
      const err = {};

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});