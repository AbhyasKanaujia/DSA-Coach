const libraryService = require('../../../src/services/LibraryService');
const collectionRepository = require('../../../src/repositories/CollectionRepository');
const userCollectionRepository = require('../../../src/repositories/UserCollectionRepository');
const Collection = require('../../../src/models/Collection');
const User = require('../../../src/models/User');
const UserCollection = require('../../../src/models/UserCollection');
const { NotFoundError, ConflictError } = require('../../../src/utils/validators');

describe('LibraryService', () => {
  let user, collection;

  beforeEach(async () => {
    user = await User.create({
      email: 'user@test.com',
      passwordHash: 'hashed',
      name: 'Test User'
    });

    collection = await Collection.create({
      name: 'Test Collection',
      createdBy: user._id,
      isPublic: true
    });
  });

  describe('addToLibrary (subscribe)', () => {
    it('should add a collection to user library', async () => {
      const result = await libraryService.addToLibrary(user._id, collection._id);

      expect(result.userId.toString()).toBe(user._id.toString());
      expect(result.collectionId.toString()).toBe(collection._id.toString());
      expect(result.isActive).toBe(true);
    });

    it('should throw ConflictError on double subscribe', async () => {
      await libraryService.addToLibrary(user._id, collection._id);

      await expect(libraryService.addToLibrary(user._id, collection._id))
        .rejects
        .toThrow('Collection already in library');
    });

    it('should throw NotFoundError if collection does not exist', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId();
      await expect(libraryService.addToLibrary(user._id, fakeId))
        .rejects
        .toThrow('Collection not found');
    });
  });

  describe('getUserLibrary', () => {
    it('should return only the user subscriptions', async () => {
      const user2 = await User.create({ email: 'u2@test.com', passwordHash: 'h', name: 'U2' });
      const collection2 = await Collection.create({ name: 'Other', createdBy: user._id, isPublic: true });

      await libraryService.addToLibrary(user._id, collection._id);
      await libraryService.addToLibrary(user2._id, collection2._id);

      const result = await libraryService.getUserLibrary(user._id);
      expect(result).toHaveLength(1);
      expect(result[0].collectionId._id.toString()).toBe(collection._id.toString());
    });

    it('should return empty array when user has no subscriptions', async () => {
      const result = await libraryService.getUserLibrary(user._id);
      expect(result).toEqual([]);
    });
  });

  describe('activateCollection', () => {
    it('should set isActive to true', async () => {
      await libraryService.addToLibrary(user._id, collection._id);
      const result = await libraryService.activateCollection(user._id, collection._id);

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundError if not in library', async () => {
      await expect(libraryService.activateCollection(user._id, collection._id))
        .rejects
        .toThrow('Collection in library not found');
    });
  });

  describe('deactivateCollection', () => {
    it('should set isActive to false', async () => {
      await libraryService.addToLibrary(user._id, collection._id);
      await libraryService.activateCollection(user._id, collection._id);

      const result = await libraryService.deactivateCollection(user._id, collection._id);
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundError if not in library', async () => {
      await expect(libraryService.deactivateCollection(user._id, collection._id))
        .rejects
        .toThrow('Collection in library not found');
    });
  });

  describe('unsubscribe', () => {
    it('should remove the subscription from the library', async () => {
      await libraryService.addToLibrary(user._id, collection._id);
      await libraryService.unsubscribe(user._id, collection._id);

      const library = await libraryService.getUserLibrary(user._id);
      expect(library).toHaveLength(0);
    });

    it('should throw NotFoundError if not subscribed', async () => {
      await expect(libraryService.unsubscribe(user._id, collection._id))
        .rejects
        .toThrow('Collection in library not found');
    });

    it('should NOT touch UserProblemState when unsubscribing', async () => {
      const Problem = require('../../../src/models/Problem');
      const UserProblemState = require('../../../src/models/UserProblemState');

      const problem = await Problem.create({
        title: 'Test Prob',
        description: 'desc',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: 'lib-1',
        createdBy: user._id
      });

      const collectionWithProblem = await Collection.create({
        name: 'With Problem',
        createdBy: user._id,
        isPublic: true,
        problemIds: [problem._id]
      });

      await libraryService.addToLibrary(user._id, collectionWithProblem._id);
      await libraryService.activateCollection(user._id, collectionWithProblem._id);

      const state = await UserProblemState.create({
        userId: user._id,
        problemId: problem._id,
        status: 'learning',
        easeFactor: 1.8,
        interval: 3,
        repetitions: 1,
        nextReviewAt: new Date()
      });

      await libraryService.unsubscribe(user._id, collectionWithProblem._id);

      const stateAfter = await UserProblemState.findById(state._id);
      expect(stateAfter).not.toBeNull();
      expect(stateAfter.status).toBe('learning');
      expect(stateAfter.easeFactor).toBe(1.8);
    });

    it('should allow resubscribe after unsubscribe', async () => {
      await libraryService.addToLibrary(user._id, collection._id);
      await libraryService.unsubscribe(user._id, collection._id);

      const result = await libraryService.addToLibrary(user._id, collection._id);
      expect(result).toBeDefined();
      expect(result.collectionId.toString()).toBe(collection._id.toString());
    });
  });
});