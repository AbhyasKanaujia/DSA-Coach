const User = require('../models/User');

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findById(userId) {
    return await User.findById(userId);
  }

  async update(userId, updates) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  async incrementStats(userId, fields) {
    const updateOps = { $inc: {}, $set: {} };
    for (const [field, value] of Object.entries(fields)) {
      if (field === 'lastActiveDate') {
        updateOps.$set['stats.lastActiveDate'] = value;
      } else {
        updateOps.$inc[`stats.${field}`] = value;
      }
    }

    return await User.findByIdAndUpdate(
      userId,
      updateOps,
      { new: true }
    );
  }
}

module.exports = new UserRepository();