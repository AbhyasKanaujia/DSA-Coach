const userService = require('../services/UserService');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await userService.createUser({ email, password, name });
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await userService.authenticate(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserStats(req.userId);
      res.json({ userId: req.userId, email: req.email, stats: user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateUser(req.userId, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await userService.getUserStats(req.userId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();