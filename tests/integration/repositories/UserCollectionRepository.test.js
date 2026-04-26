const userCollectionRepository = require('../../../src/repositories/UserCollectionRepository');
const UserCollection = require('../../../src/models/UserCollection');
const Collection = require('../../../src/models/Collection');
const User = require('../../../src/models/User');
const mongoose = require('mongoose');

describe('UserCollectionRepository', () => {
  let user1, user2, collection;

  beforeEach(async () => {
    user1 = await User.create({ email: 'u1@test.com', passwordHash: 'h', name: 'U1' });
    user2 = await User.create({ email: 'u2@test.com', passwordHash: 'h', name: 'U2' });
    collection = await Collection.create({ name: 'Test', createdBy: user1._id, isPublic: true });
  });

  describe('unique compound index', () => {
    it('should reject duplicate (userId, collectionId) pair', async () => {
      await userCollectionRepository.subscribe(user1._id, collection._id);

      await expect(userCollectionRepository.create({ userId: user1._id, collectionId: collection._id }))
        .rejects
        .toThrow();
    });
  });

  describe('findActiveByUser', () => {
    it('should return only active subscriptions with populated collectionId', async () => {
      const collection2 = await Collection.create({ name: 'Inactive', createdBy: user1._id, isPublic: true });

      await userCollectionRepository.subscribe(user1._id, collection._id);
      const sub2 = await userCollectionRepository.subscribe(user2._id, collection2._id);

      // user2's sub is active by default, deactivate it
      await userCollectionRepository.setActive(user2._id, collection2._id, false);

      const result = await userCollectionRepository.findActiveByUser(user1._id);
      expect(result).toHaveLength(1);

      // Verify population — collectionId should be an object, not a string
      const sub = result[0];
      expect(typeof sub.collectionId).toBe('object');
      expect(sub.collectionId._id).toBeDefined();
      expect(sub.collectionId.name).toBe('Test');
    });
  });

  describe('unsubscribeAll', () => {
    it('should delete all subscriptions for a collection across users', async () => {
      await userCollectionRepository.subscribe(user1._id, collection._id);
      await userCollectionRepository.subscribe(user2._id, collection._id);

      // user1 also has another collection — should NOT be affected
      const otherCollection = await Collection.create({ name: 'Other', createdBy: user1._id, isPublic: true });
      await userCollectionRepository.subscribe(user1._id, otherCollection._id);

      await userCollectionRepository.unsubscribeAll(collection._id);

      const remaining = await UserCollection.find({ collectionId: collection._id });
      expect(remaining).toHaveLength(0);

      // user1's other subscription is untouched
      const otherSub = await UserCollection.find({ userId: user1._id, collectionId: otherCollection._id });
      expect(otherSub).toHaveLength(1);
    });
  });
});