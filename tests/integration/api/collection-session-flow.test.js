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

describe('Collection-Session Flow Tests', () => {
  let adminToken, userToken;
  let adminUser, regularUser;
  let problem1, problem2, problem3;

  beforeEach(async () => {
    await User.deleteMany({});
    await Problem.deleteMany({});
    await Collection.deleteMany({});
    await UserCollection.deleteMany({});
    await UserProblemState.deleteMany({});

    adminUser = await User.create({ email: 'admin-flow@test.com', passwordHash: 'h', name: 'Admin', role: 'admin' });
    regularUser = await User.create({ email: 'user-flow@test.com', passwordHash: 'h', name: 'User' });

    adminToken = signToken(adminUser);
    userToken = signToken(regularUser);

    problem1 = await Problem.create({ title: 'Flow P1', description: 'D1', difficulty: 'easy', source: 'lc', sourceId: 'f1', createdBy: adminUser._id });
    problem2 = await Problem.create({ title: 'Flow P2', description: 'D2', difficulty: 'medium', source: 'lc', sourceId: 'f2', createdBy: adminUser._id });
    problem3 = await Problem.create({ title: 'Flow P3', description: 'D3', difficulty: 'hard', source: 'lc', sourceId: 'f3', createdBy: adminUser._id });
  });

  async function createAndSubscribe(name, problemIds, activate = true) {
    const collRes = await request(app)
      .post('/api/collections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name, problemIds });
    const collectionId = collRes.body._id;

    await request(app).post(`/api/library/${collectionId}/add`).set('Authorization', `Bearer ${userToken}`);

    if (activate) {
      // Subscription is isActive: true by default, just ensure it
      await request(app).patch(`/api/library/${collectionId}/activate`).set('Authorization', `Bearer ${userToken}`);
    } else {
      // Explicitly deactivate since default is true
      await request(app).patch(`/api/library/${collectionId}/deactivate`).set('Authorization', `Bearer ${userToken}`);
    }

    return collectionId;
  }

  describe('1. Empty library → session returns no problems', () => {
    it('should return empty session when user has no active collections', async () => {
      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.problems).toEqual([]);
      expect(res.body.meta.totalAvailable).toBe(0);
    });
  });

  describe('2. Single active collection → session contains its problems', () => {
    it('should return all problems from the active collection with userState.status=new', async () => {
      await createAndSubscribe('Single Coll', [problem1._id.toString(), problem2._id.toString()]);

      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.problems.length).toBeGreaterThanOrEqual(2);

      const titles = res.body.problems.map(p => p.title);
      expect(titles).toContain('Flow P1');
      expect(titles).toContain('Flow P2');

      res.body.problems.forEach(p => {
        expect(p.userState.status).toBe('new');
      });
    });
  });

  describe('3. Multi-collection dedup — shared problem appears once', () => {
    it('should not duplicate a problem that belongs to two active collections', async () => {
      // Both collections contain problem1
      await createAndSubscribe('Coll A', [problem1._id.toString(), problem2._id.toString()]);
      await createAndSubscribe('Coll B', [problem1._id.toString(), problem3._id.toString()]);

      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);

      const problemIds = res.body.problems.map(p => p._id.toString());
      const p1Count = problemIds.filter(id => id === problem1._id.toString()).length;
      expect(p1Count).toBe(1);

      // All three unique problems should appear
      expect(problemIds).toContain(problem1._id.toString());
      expect(problemIds).toContain(problem2._id.toString());
      expect(problemIds).toContain(problem3._id.toString());
    });
  });

  describe('4. Active vs inactive — only active collections contribute', () => {
    it('should only include problems from the active collection', async () => {
      // Create and subscribe, but leave inactive
      await createAndSubscribe('Active Coll', [problem1._id.toString()], true);
      await createAndSubscribe('Inactive Coll', [problem2._id.toString(), problem3._id.toString()], false);

      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);

      const titles = res.body.problems.map(p => p.title);
      expect(titles).toContain('Flow P1');
      expect(titles).not.toContain('Flow P2');
      expect(titles).not.toContain('Flow P3');
    });
  });

  describe('5. Deactivate mid-stream → next session is empty', () => {
    it('should return empty session after deactivating the only active collection', async () => {
      const collectionId = await createAndSubscribe('To Deactivate', [problem1._id.toString()]);

      // Start first session (will be auto-abandoned)
      await request(app).post('/api/sessions/start').set('Authorization', `Bearer ${userToken}`);

      // Deactivate
      await request(app)
        .patch(`/api/library/${collectionId}/deactivate`)
        .set('Authorization', `Bearer ${userToken}`);

      // Start new session
      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.problems).toEqual([]);
      expect(res.body.meta.totalAvailable).toBe(0);
    });
  });

  describe('6. Progress survives unsubscribe — the decoupling claim', () => {
    it('should preserve UserProblemState after unsubscribing and resubscribing', async () => {
      const collectionId = await createAndSubscribe('Progress Test', [problem1._id.toString()]);

      // Start session and review problem1
      const sessionRes = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${userToken}`);

      const sessionId = sessionRes.body.sessionId;

      // Submit a review to establish progress
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ problemId: problem1._id.toString(), quality: 'easy', sessionId });

      // Verify progress exists
      const stateBefore = await UserProblemState.findOne({ userId: regularUser._id, problemId: problem1._id });
      expect(stateBefore).not.toBeNull();
      expect(stateBefore.status).not.toBe('new');
      const savedEaseFactor = stateBefore.easeFactor;
      const savedInterval = stateBefore.interval;

      // Unsubscribe
      await request(app)
        .delete(`/api/library/${collectionId}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Progress still there after unsubscribe
      const stateMid = await UserProblemState.findOne({ userId: regularUser._id, problemId: problem1._id });
      expect(stateMid).not.toBeNull();
      expect(stateMid.easeFactor).toBe(savedEaseFactor);

      // Resubscribe and activate
      await request(app).post(`/api/library/${collectionId}/add`).set('Authorization', `Bearer ${userToken}`);
      await request(app).patch(`/api/library/${collectionId}/activate`).set('Authorization', `Bearer ${userToken}`);

      // Set nextReviewAt to past so the problem appears as due in session
      await UserProblemState.findOneAndUpdate(
        { userId: regularUser._id, problemId: problem1._id },
        { $set: { nextReviewAt: new Date('2020-01-01') } }
      );

      // Start session and verify progress is preserved
      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const p1InSession = res.body.problems.find(p => p._id.toString() === problem1._id.toString());
      expect(p1InSession).toBeDefined();
      expect(p1InSession.userState.easeFactor).toBe(savedEaseFactor);
      expect(p1InSession.userState.interval).toBe(savedInterval);
    });
  });

  describe('7. Delete collection mid-flight → next session does not crash', () => {
    it('should return empty session after admin deletes the subscribed collection', async () => {
      const collectionId = await createAndSubscribe('To Be Deleted', [problem1._id.toString()]);

      // Admin deletes collection
      await request(app)
        .delete(`/api/collections/${collectionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // User starts new session — should not crash, returns empty
      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.problems).toEqual([]);
    });
  });
});