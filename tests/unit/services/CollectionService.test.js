const collectionService = require('../../../src/services/CollectionService');
const collectionRepository = require('../../../src/repositories/CollectionRepository');
const userCollectionRepository = require('../../../src/repositories/UserCollectionRepository');
const problemRepository = require('../../../src/repositories/ProblemRepository');
const Collection = require('../../../src/models/Collection');
const Problem = require('../../../src/models/Problem');
const User = require('../../../src/models/User');
const UserCollection = require('../../../src/models/UserCollection');
const { ValidationError, NotFoundError } = require('../../../src/utils/validators');

describe('CollectionService', () => {
  let adminUser;
  let problem1, problem2;

  beforeEach(async () => {
    adminUser = await User.create({
      email: 'admin@test.com',
      passwordHash: 'hashed',
      name: 'Admin',
      role: 'admin'
    });

    problem1 = await Problem.create({
      title: 'Two Sum',
      description: 'Find two numbers',
      difficulty: 'easy',
      source: 'leetcode',
      sourceId: '1',
      createdBy: adminUser._id
    });

    problem2 = await Problem.create({
      title: 'Binary Search',
      description: 'Search sorted array',
      difficulty: 'medium',
      source: 'leetcode',
      sourceId: '2',
      createdBy: adminUser._id
    });
  });

  describe('createCollection', () => {
    it('should create a collection with valid data and problem references', async () => {
      const data = {
        name: 'Neetcode 150',
        problemIds: [problem1._id, problem2._id],
        createdBy: adminUser._id,
        isPublic: true
      };

      const result = await collectionService.createCollection(data);

      expect(result._id).toBeDefined();
      expect(result.name).toBe('Neetcode 150');
      expect(result.problemIds).toHaveLength(2);
      expect(result.isPublic).toBe(true);
    });

    it('should create a collection with no problems', async () => {
      const data = {
        name: 'Empty Collection',
        problemIds: [],
        createdBy: adminUser._id,
        isPublic: true
      };

      const result = await collectionService.createCollection(data);

      expect(result.name).toBe('Empty Collection');
      expect(result.problemIds).toHaveLength(0);
    });

    it('should throw ValidationError when problemIds reference non-existent problems', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const data = {
        name: 'Bad Refs',
        problemIds: [problem1._id, fakeId],
        createdBy: adminUser._id,
        isPublic: true
      };

      await expect(collectionService.createCollection(data))
        .rejects
        .toThrow(expect.objectContaining({
          name: 'ValidationError',
          field: 'problemIds'
        }));

      const collections = await Collection.find({});
      expect(collections).toHaveLength(0);
    });

    it('should list all missing problem IDs in the error message', async () => {
      const fake1 = new mongoose.Types.ObjectId();
      const fake2 = new mongoose.Types.ObjectId();
      const data = {
        name: 'All Bad',
        problemIds: [fake1, fake2],
        createdBy: adminUser._id,
        isPublic: true
      };

      const err = await collectionService.createCollection(data).catch(e => e);
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toContain(fake1.toString());
      expect(err.message).toContain(fake2.toString());
    });
  });

  describe('getCollection', () => {
    it('should return an existing collection', async () => {
      const created = await collectionRepository.create({
        name: 'Test',
        createdBy: adminUser._id,
        isPublic: true
      });

      const result = await collectionService.getCollection(created._id);
      expect(result.name).toBe('Test');
    });

    it('should throw NotFoundError for missing collection', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(collectionService.getCollection(fakeId))
        .rejects
        .toThrow('Collection not found');
    });
  });

  describe('listCollections', () => {
    it('should return only public collections', async () => {
      await collectionRepository.create({ name: 'Public', createdBy: adminUser._id, isPublic: true });
      await collectionRepository.create({ name: 'Private', createdBy: adminUser._id, isPublic: false });

      const result = await collectionService.listCollections();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Public');
    });

    it('should return empty array when no public collections exist', async () => {
      const result = await collectionService.listCollections();
      expect(result).toEqual([]);
    });

    it('should forward pagination parameters', async () => {
      for (let i = 0; i < 5; i++) {
        await collectionRepository.create({ name: `Pub ${i}`, createdBy: adminUser._id, isPublic: true });
      }

      const page1 = await collectionService.listCollections({ page: 1, limit: 2 });
      const page2 = await collectionService.listCollections({ page: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });
  });

  describe('updateCollection', () => {
    let collection;

    beforeEach(async () => {
      collection = await collectionRepository.create({
        name: 'Original',
        description: 'Original desc',
        isPublic: true,
        isEditable: false,
        createdBy: adminUser._id
      });
    });

    it('should update allowed fields', async () => {
      const result = await collectionService.updateCollection(collection._id, {
        name: 'Updated',
        description: 'New desc',
        isPublic: false,
        isEditable: true
      });

      expect(result.name).toBe('Updated');
      expect(result.description).toBe('New desc');
      expect(result.isPublic).toBe(false);
      expect(result.isEditable).toBe(true);
    });

    it('should throw NotFoundError for missing collection', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(collectionService.updateCollection(fakeId, { name: 'X' }))
        .rejects
        .toThrow('Collection not found');
    });

    it('should reject disallowed fields like problemIds', async () => {
      await expect(collectionService.updateCollection(collection._id, { problemIds: ['abc'] }))
        .rejects
        .toThrow(expect.objectContaining({
          name: 'ValidationError',
          field: 'updates'
        }));
    });

    it('should preserve untouched fields on partial update', async () => {
      const result = await collectionService.updateCollection(collection._id, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('Original desc');
      expect(result.isPublic).toBe(true);
      expect(result.isEditable).toBe(false);
    });
  });

  describe('deleteCollection', () => {
    it('should delete the collection', async () => {
      const collection = await collectionRepository.create({
        name: 'To Delete',
        createdBy: adminUser._id,
        isPublic: true
      });

      await collectionService.deleteCollection(collection._id);

      const found = await collectionRepository.findById(collection._id);
      expect(found).toBeNull();
    });

    it('should cascade-delete all UserCollection subscriptions', async () => {
      const collection = await collectionRepository.create({
        name: 'Subscribed',
        createdBy: adminUser._id,
        isPublic: true,
        problemIds: [problem1._id]
      });

      const user1 = await User.create({ email: 'u1@test.com', passwordHash: 'h', name: 'U1' });
      const user2 = await User.create({ email: 'u2@test.com', passwordHash: 'h', name: 'U2' });

      await userCollectionRepository.subscribe(user1._id, collection._id);
      await userCollectionRepository.subscribe(user2._id, collection._id);

      await collectionService.deleteCollection(collection._id);

      const remaining = await UserCollection.find({ collectionId: collection._id });
      expect(remaining).toHaveLength(0);
    });

    it('should NOT touch UserProblemState when deleting collection', async () => {
      const UserProblemState = require('../../../src/models/UserProblemState');
      const collection = await collectionRepository.create({
        name: 'With Progress',
        createdBy: adminUser._id,
        isPublic: true,
        problemIds: [problem1._id]
      });

      const user = await User.create({ email: 'progress@test.com', passwordHash: 'h', name: 'ProgUser' });
      await userCollectionRepository.subscribe(user._id, collection._id);

      const state = await UserProblemState.create({
        userId: user._id,
        problemId: problem1._id,
        status: 'review',
        easeFactor: 2.5,
        interval: 7,
        repetitions: 3,
        nextReviewAt: new Date()
      });

      await collectionService.deleteCollection(collection._id);

      const stateAfter = await UserProblemState.findById(state._id);
      expect(stateAfter).not.toBeNull();
      expect(stateAfter.status).toBe('review');
      expect(stateAfter.easeFactor).toBe(2.5);
    });

    it('should throw NotFoundError for missing collection', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(collectionService.deleteCollection(fakeId))
        .rejects
        .toThrow('Collection not found');
    });
  });

  describe('addProblemToCollection', () => {
    let collection;

    beforeEach(async () => {
      collection = await collectionRepository.create({
        name: 'Add Test',
        createdBy: adminUser._id,
        isPublic: true,
        problemIds: []
      });
    });

    it('should add a problem to the collection', async () => {
      const result = await collectionService.addProblemToCollection(collection._id, problem1._id);

      expect(result.problemIds.map(id => id.toString())).toContain(problem1._id.toString());
    });

    it('should be idempotent — adding same problem twice does not duplicate', async () => {
      await collectionService.addProblemToCollection(collection._id, problem1._id);
      const result = await collectionService.addProblemToCollection(collection._id, problem1._id);

      const ids = result.problemIds.map(id => id.toString());
      const count = ids.filter(id => id === problem1._id.toString()).length;
      expect(count).toBe(1);
    });

    it('should throw NotFoundError if collection does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(collectionService.addProblemToCollection(fakeId, problem1._id))
        .rejects
        .toThrow('Collection not found');
    });

    it('should throw NotFoundError if problem does not exist', async () => {
      const fakeProblemId = new mongoose.Types.ObjectId();
      await expect(collectionService.addProblemToCollection(collection._id, fakeProblemId))
        .rejects
        .toThrow('Problem not found');
    });
  });

  describe('removeProblemFromCollection', () => {
    let collection;

    beforeEach(async () => {
      collection = await collectionRepository.create({
        name: 'Remove Test',
        createdBy: adminUser._id,
        isPublic: true,
        problemIds: [problem1._id, problem2._id]
      });
    });

    it('should remove a problem from the collection', async () => {
      const result = await collectionService.removeProblemFromCollection(collection._id, problem1._id);

      const ids = result.problemIds.map(id => id.toString());
      expect(ids).not.toContain(problem1._id.toString());
      expect(ids).toContain(problem2._id.toString());
    });

    it('should be a no-op if problem is not in collection', async () => {
      const otherProblem = await Problem.create({
        title: 'Other',
        description: 'Other',
        difficulty: 'hard',
        source: 'leetcode',
        sourceId: '99',
        createdBy: adminUser._id
      });

      const result = await collectionService.removeProblemFromCollection(collection._id, otherProblem._id);

      expect(result.problemIds).toHaveLength(2);
    });

    it('should throw NotFoundError if collection does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(collectionService.removeProblemFromCollection(fakeId, problem1._id))
        .rejects
        .toThrow('Collection not found');
    });
  });
});

const mongoose = require('mongoose');