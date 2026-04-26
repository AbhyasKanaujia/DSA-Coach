const collectionRepository = require('../../../src/repositories/CollectionRepository');
const Collection = require('../../../src/models/Collection');
const User = require('../../../src/models/User');
const mongoose = require('mongoose');

describe('CollectionRepository', () => {
  let adminUser;

  beforeEach(async () => {
    adminUser = await User.create({
      email: 'admin-repo@test.com',
      passwordHash: 'hashed',
      name: 'Admin',
      role: 'admin'
    });
  });

  describe('findPublic', () => {
    it('should return only public collections and exclude private', async () => {
      await Collection.create({ name: 'Public 1', createdBy: adminUser._id, isPublic: true });
      await Collection.create({ name: 'Private', createdBy: adminUser._id, isPublic: false });
      await Collection.create({ name: 'Public 2', createdBy: adminUser._id, isPublic: true });

      const result = await collectionRepository.findPublic();

      expect(result).toHaveLength(2);
      expect(result.every(c => c.isPublic === true)).toBe(true);
    });

    it('should paginate correctly', async () => {
      for (let i = 0; i < 5; i++) {
        await Collection.create({ name: `Pub ${i}`, createdBy: adminUser._id, isPublic: true });
      }

      const page1 = await collectionRepository.findPublic({ page: 1, limit: 2 });
      const page2 = await collectionRepository.findPublic({ page: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });
  });

  describe('addProblem (idempotency)', () => {
    it('should not duplicate a problem when added twice via $addToSet', async () => {
      const collection = await Collection.create({
        name: 'Idempotent',
        createdBy: adminUser._id,
        isPublic: true,
        problemIds: []
      });

      const pid = new mongoose.Types.ObjectId();

      await collectionRepository.addProblem(collection._id, pid);
      const result = await collectionRepository.addProblem(collection._id, pid);

      const ids = result.problemIds.map(id => id.toString());
      const count = ids.filter(id => id === pid.toString()).length;
      expect(count).toBe(1);
    });
  });

  describe('removeProblemFromAll', () => {
    it('should remove problem from all collections containing it', async () => {
      const pid = new mongoose.Types.ObjectId();
      const otherPid = new mongoose.Types.ObjectId();

      const c1 = await Collection.create({ name: 'C1', createdBy: adminUser._id, problemIds: [pid, otherPid] });
      const c2 = await Collection.create({ name: 'C2', createdBy: adminUser._id, problemIds: [pid] });
      const c3 = await Collection.create({ name: 'C3', createdBy: adminUser._id, problemIds: [otherPid] });

      await collectionRepository.removeProblemFromAll(pid);

      const updated1 = await Collection.findById(c1._id);
      const updated2 = await Collection.findById(c2._id);
      const updated3 = await Collection.findById(c3._id);

      expect(updated1.problemIds.map(id => id.toString())).not.toContain(pid.toString());
      expect(updated1.problemIds.map(id => id.toString())).toContain(otherPid.toString());

      expect(updated2.problemIds).toHaveLength(0);

      expect(updated3.problemIds).toHaveLength(1);
      expect(updated3.problemIds.map(id => id.toString())).toContain(otherPid.toString());
    });
  });
});