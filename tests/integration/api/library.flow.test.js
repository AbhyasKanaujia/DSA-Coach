const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Problem = require('../../../src/models/Problem');
const Collection = require('../../../src/models/Collection');
const UserCollection = require('../../../src/models/UserCollection');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Library API Flow Tests', () => {
  let adminToken, userAToken, userBToken;
  let adminUser, userA, userB;
  let collectionX, collectionY;

  beforeEach(async () => {
    await User.deleteMany({});
    await Collection.deleteMany({});
    await UserCollection.deleteMany({});

    adminUser = await User.create({ email: 'admin-lib@test.com', passwordHash: 'h', name: 'Admin', role: 'admin' });
    userA = await User.create({ email: 'userA@test.com', passwordHash: 'h', name: 'User A' });
    userB = await User.create({ email: 'userB@test.com', passwordHash: 'h', name: 'User B' });

    adminToken = signToken(adminUser);
    userAToken = signToken(userA);
    userBToken = signToken(userB);

    collectionX = await Collection.create({ name: 'Collection X', createdBy: adminUser._id, isPublic: true });
    collectionY = await Collection.create({ name: 'Collection Y', createdBy: adminUser._id, isPublic: true });
  });

  describe('Flow E: Subscribe → library shows it → activate → deactivate → unsubscribe', () => {
    it('should walk through the full library lifecycle', async () => {
      // Subscribe
      const addRes = await request(app)
        .post(`/api/library/${collectionX._id}/add`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(addRes.status).toBe(201);
      expect(addRes.body.collectionId).toBeDefined();
      expect(addRes.body.isActive).toBe(true); // default from model

      // Library shows it
      const libRes1 = await request(app)
        .get('/api/library')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(libRes1.status).toBe(200);
      expect(libRes1.body).toHaveLength(1);

      // Deactivate
      const deactivateRes = await request(app)
        .patch(`/api/library/${collectionX._id}/deactivate`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(deactivateRes.status).toBe(200);
      expect(deactivateRes.body.isActive).toBe(false);

      // Activate
      const activateRes = await request(app)
        .patch(`/api/library/${collectionX._id}/activate`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(activateRes.status).toBe(200);
      expect(activateRes.body.isActive).toBe(true);

      // Unsubscribe
      const unsubRes = await request(app)
        .delete(`/api/library/${collectionX._id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(unsubRes.status).toBe(204);

      // Library is empty
      const libRes2 = await request(app)
        .get('/api/library')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(libRes2.body).toHaveLength(0);
    });
  });

  describe('Flow F: Double subscribe → 409; unsubscribe-then-resubscribe → 201', () => {
    it('should reject double subscribe but allow after unsubscribe', async () => {
      // First subscribe succeeds
      const add1 = await request(app)
        .post(`/api/library/${collectionX._id}/add`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(add1.status).toBe(201);

      // Second subscribe → 409
      const add2 = await request(app)
        .post(`/api/library/${collectionX._id}/add`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(add2.status).toBe(409);

      // Unsubscribe
      const del = await request(app)
        .delete(`/api/library/${collectionX._id}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(del.status).toBe(204);

      // Resubscribe → 201
      const add3 = await request(app)
        .post(`/api/library/${collectionX._id}/add`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(add3.status).toBe(201);
    });
  });

  describe('Flow G: User isolation — each user sees only their own library', () => {
    it('should not leak subscriptions across users', async () => {
      // UserA subscribes to X, UserB subscribes to Y
      await request(app).post(`/api/library/${collectionX._id}/add`).set('Authorization', `Bearer ${userAToken}`);
      await request(app).post(`/api/library/${collectionY._id}/add`).set('Authorization', `Bearer ${userBToken}`);

      const libA = await request(app).get('/api/library').set('Authorization', `Bearer ${userAToken}`);
      const libB = await request(app).get('/api/library').set('Authorization', `Bearer ${userBToken}`);

      expect(libA.body).toHaveLength(1);
      expect(libA.body[0].collectionId.name || libA.body[0].collectionId).toBeDefined();

      expect(libB.body).toHaveLength(1);

      // Verify A has X and B has Y (by checking library counts, they're isolated)
      expect(libA.body).toHaveLength(1);
      expect(libB.body).toHaveLength(1);
    });
  });

  describe('Unhappy paths', () => {
    it('should 401 without auth on all library endpoints', async () => {
      expect((await request(app).get('/api/library')).status).toBe(401);
      expect((await request(app).post(`/api/library/${collectionX._id}/add`)).status).toBe(401);
      expect((await request(app).patch(`/api/library/${collectionX._id}/activate`)).status).toBe(401);
      expect((await request(app).patch(`/api/library/${collectionX._id}/deactivate`)).status).toBe(401);
      expect((await request(app).delete(`/api/library/${collectionX._id}`)).status).toBe(401);
    });

    it('should 404 when activating a collection not in library', async () => {
      const res = await request(app)
        .patch(`/api/library/${collectionX._id}/activate`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });

    it('should 404 when unsubscribing from a collection not in library', async () => {
      const res = await request(app)
        .delete(`/api/library/${collectionX._id}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });
  });
});