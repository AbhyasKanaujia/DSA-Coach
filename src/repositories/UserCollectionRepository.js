const UserCollection = require('../models/UserCollection');

class UserCollectionRepository {
  async create(userCollectionData) {
    const userCollection = new UserCollection(userCollectionData);
    return await userCollection.save();
  }

  async findByUserAndCollection(userId, collectionId) {
    return await UserCollection.findOne({ userId, collectionId });
  }

  async findAllByUser(userId, filters = {}) {
    const query = { userId, ...filters };
    return await UserCollection.find(query)
      .populate('collectionId')
      .sort({ addedAt: -1 });
  }

  async subscribe(userId, collectionId) {
    const userCollection = new UserCollection({ userId, collectionId });
    return await userCollection.save();
  }

  async unsubscribe(userId, collectionId) {
    return await UserCollection.findOneAndDelete({ userId, collectionId });
  }

  async setActive(userId, collectionId, isActive) {
    return await UserCollection.findOneAndUpdate(
      { userId, collectionId },
      { $set: { isActive } },
      { new: true }
    );
  }

  async countByUser(userId) {
    return await UserCollection.countDocuments({ userId });
  }

  async findActiveByUser(userId) {
    return await UserCollection.find({ userId, isActive: true })
      .populate('collectionId')
      .sort({ addedAt: -1 });
  }
}

module.exports = new UserCollectionRepository();