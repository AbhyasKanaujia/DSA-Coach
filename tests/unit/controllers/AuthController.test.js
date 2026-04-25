const authController = require('../../../src/controllers/AuthController');
const userService = require('../../../src/services/UserService');

jest.mock('../../../src/services/UserService');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      userId: 'user123',
      email: 'test@example.com'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const mockUser = { _id: 'user123', email: 'test@example.com', name: 'Test User' };
      userService.createUser.mockResolvedValue(mockUser);

      await authController.register(req, res, next);

      expect(userService.createUser).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it('should return 400 if email is missing', async () => {
      req.body = { password: 'password123' };

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', async () => {
      req.body = { email: 'test@example.com' };

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should forward errors to error handler', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      userService.createUser.mockRejectedValue(new Error('Email already registered'));

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        token: 'jwt-token',
        user: { _id: 'user123', email: 'test@example.com' }
      };
      userService.authenticate.mockResolvedValue(mockResult);

      await authController.login(req, res, next);

      expect(userService.authenticate).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 if email is missing', async () => {
      req.body = { password: 'password123' };

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(userService.authenticate).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', async () => {
      req.body = { email: 'test@example.com' };

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(userService.authenticate).not.toHaveBeenCalled();
    });

    it('should forward errors to error handler', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      userService.authenticate.mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com', name: 'Test User' };
      userService.getUserById.mockResolvedValue(mockUser);

      await authController.getProfile(req, res, next);

      expect(userService.getUserById).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should forward errors to error handler', async () => {
      userService.getUserById.mockRejectedValue(new Error('User not found'));

      await authController.getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      req.body = { name: 'Updated Name' };

      const mockUser = { _id: 'user123', name: 'Updated Name' };
      userService.updateProfile.mockResolvedValue(mockUser);

      await authController.updateProfile(req, res, next);

      expect(userService.updateProfile).toHaveBeenCalledWith('user123', req.body);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should forward errors to error handler', async () => {
      userService.updateProfile.mockRejectedValue(new Error('User not found'));

      await authController.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});