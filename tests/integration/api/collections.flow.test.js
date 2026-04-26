const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Problem = require('../../../src/models/Problem');
const Collection = require('../../../src/models/Collection');
const UserCollection = require('../../../src/models/UserCollection');
const UserProblemState = require('../../../src/models/UserProblemState');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Collections API Flow Tests', () => {
  let adminToken, userToken, adminUser, regularUser;
  let problem1, problem2, problem3;

  beforeEach(async () => {
    await User.deleteMany({});
    await Problem.deleteMany({});
    await Collection.deleteMany({});
    await UserCollection.deleteMany({});

    adminUser = await User.create({
      email: 'admin-coll@test.com',
      passwordHash: 'hashed',
      name: 'Admin',
      role: 'admin'
    });

    regularUser = await User.create({
      email: 'user-coll@test.com',
      passwordHash: 'hashed',
      name: 'Regular',
      role: 'user'
    });

    adminToken = signToken(adminUser);
    userToken = signToken(regularUser);

    problem1 = await Problem.create({ title: 'P1', description: 'D1', difficulty: 'easy', source: 'lc', sourceId: '1', createdBy: adminUser._id });
    problem2 = await Problem.create({ title: 'P2', description: 'D2', difficulty: 'medium', source: 'lc', sourceId: '2', createdBy: adminUser._id });
    problem3 = await Problem.create({ title: 'P3', description: 'D3', difficulty: 'hard', source: 'lc', sourceId: '3', createdBy: adminUser._id });
  });

  describe('Flow A: Admin lifecycle (create → get → update → add problem → remove problem → delete)', () => {
    it('should walk through the full admin lifecycle', async () => {
      // Create collection with 2 problems
      const createRes = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Lifecycle Collection', problemIds: [problem1._id.toString(), problem2._id.toString()] });

      expect(createRes.status).toBe(201);
      expect(createRes.body.name).toBe('Lifecycle Collection');
      expect(createRes.body.problemIds).toHaveLength(2);
      const collectionId = createRes.body._id;

      // GET /collections includes it (public)
      const listRes = await request(app)
        .get('/api/collections')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.some(c => c._id === collectionId)).toBe(true);

      // GET /:id returns full details
      const getRes = await request(app)
        .get(`/api/collections/${collectionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.name).toBe('Lifecycle Collection');
      expect(getRes.body.problemIds).toHaveLength(2);

      // PUT /:id updates name
      const updateRes = await request(app)
        .put(`/api/collections/${collectionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('Updated Name');
      // description was empty, should remain empty
      expect(updateRes.body.description).toBeFalsy();

      // POST /:id/problems/:problemId adds a third
      const addProbRes = await request(app)
        .post(`/api/collections/${collectionId}/problems/${problem3._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(addProbRes.status).toBe(200);
      expect(addProbRes.body.problemIds).toHaveLength(3);

      // DELETE /:id/problems/:problemId removes one
      const removeProbRes = await request(app)
        .delete(`/api/collections/${collectionId}/problems/${problem1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(removeProbRes.status).toBe(200);
      expect(removeProbRes.body.problemIds).toHaveLength(2);

      // DELETE /:id deletes collection
      const deleteRes = await request(app)
        .delete(`/api/collections/${collectionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(204);

      // GET /:id returns 404
      const getAfterDeleteRes = await request(app)
        .get(`/api/collections/${collectionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getAfterDeleteRes.status).toBe(404);
    });
  });

  describe('Flow B: Cascade on delete — subscriptions removed, UserProblemState untouched', () => {
    it('should clean subscriptions but preserve user progress', async () => {
      // Admin creates collection
      const createRes = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cascade Test', problemIds: [problem1._id.toString()] });

      const collectionId = createRes.body._id;

      // Two users subscribe
      await request(app).post(`/api/library/${collectionId}/add`).set('Authorization', `Bearer ${adminToken}`);
      await request(app).post(`/api/library/${collectionId}/add`).set('Authorization', `Bearer ${userToken}`);

      // Admin creates progress for regularUser on problem1
      await UserProblemState.create({
        userId: regularUser._id,
        problemId: problem1._id,
        status: 'review',
        easeFactor: 2.5,
        interval: 7,
        repetitions: 3,
        nextReviewAt: new Date()
      });

      // Admin deletes collection
      await request(app)
        .delete(`/api/collections/${collectionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Both users' libraries are empty
      const adminLib = await request(app).get('/api/library').set('Authorization', `Bearer ${adminToken}`);
      const userLib = await request(app).get('/api/library').set('Authorization', `Bearer ${userToken}`);

      expect(adminLib.body).toHaveLength(0);
      expect(userLib.body).toHaveLength(0);

      // UserProblemState is untouched
      const state = await UserProblemState.findOne({ userId: regularUser._id, problemId: problem1._id });
      expect(state).not.toBeNull();
      expect(state.status).toBe('review');
      expect(state.easeFactor).toBe(2.5);
    });
  });

  describe('Flow C: Authorization enforcement', () => {
    it('should reject non-admin on POST/PUT/DELETE', async () => {
      const createRes = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Unauthorized' });
      expect(createRes.status).toBe(403);

      const fakeId = new (require('mongoose')).Types.ObjectId();
      const putRes = await request(app)
        .put(`/api/collections/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' });
      expect(putRes.status).toBe(403);

      const deleteRes = await request(app)
        .delete(`/api/collections/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(deleteRes.status).toBe(403);
    });

    it('should reject unauthenticated requests on all collection endpoints', async () => {
      const res1 = await request(app).get('/api/collections');
      expect(res1.status).toBe(401);

      const fakeId = new (require('mongoose')).Types.ObjectId();
      const res2 = await request(app).get(`/api/collections/${fakeId}`);
      expect(res2.status).toBe(401);
    });
  });

  describe('Flow D: Invalid problemId on create prevents creation', () => {
    it('should reject creation with non-existent problemIds and not persist', async () => {
      const fakeProblemId = new (require('mongoose')).Types.ObjectId();
      const res = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bad Problem Ref', problemIds: [fakeProblemId.toString()] });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe('problemIds');

      const collections = await Collection.find({});
      expect(collections).toHaveLength(0);
    });
  });
});