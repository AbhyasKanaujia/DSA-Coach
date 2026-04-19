const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Card = require('../../src/models/Card');

describe('Full Flow E2E Test', () => {
  let token;
  let userId;

  it('should complete full user journey', async () => {
    // Step 1: Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'fullflow@example.com',
        password: 'password123',
        name: 'Full Flow User'
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.email).toBe('fullflow@example.com');

    // Step 2: Login and get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'fullflow@example.com',
        password: 'password123'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();
    token = loginResponse.body.token;

    // Step 3: Create multiple cards with different solutions
    const card1Response = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionName: 'Two Sum',
        category: 'Array',
        difficulty: 'easy',
        tags: ['hashmap'],
        solutions: [
          {
            name: 'Brute Force',
            approachOrder: 0,
            intuition: 'Check all pairs',
            steps: ['Iterate through array', 'Check each pair', 'Return if sum matches'],
            code: { language: 'javascript', snippet: 'function twoSum(nums, target) { for (let i = 0; i < nums.length; i++) { for (let j = i + 1; j < nums.length; j++) { if (nums[i] + nums[j] === target) return [i, j]; } } }' },
            timeComplexity: 'O(n²)',
            spaceComplexity: 'O(1)'
          },
          {
            name: 'Hash Map',
            approachOrder: 1,
            intuition: 'Store seen numbers in a map',
            steps: ['Create empty map', 'Iterate through array', 'Check if complement exists', 'Return indices'],
            code: { language: 'javascript', snippet: 'function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) return [map.get(complement), i]; map.set(nums[i], i); } }' },
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(n)'
          }
        ]
      });

    expect(card1Response.status).toBe(201);
    expect(card1Response.body.solutions).toHaveLength(2);

    const card2Response = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionName: 'Longest Substring Without Repeating Characters',
        category: 'String',
        difficulty: 'medium',
        tags: ['sliding-window'],
        solutions: [
          {
            name: 'Sliding Window',
            approachOrder: 0,
            intuition: 'Use sliding window with hash set',
            steps: ['Initialize window', 'Expand window', 'Shrink when duplicate found', 'Track max length'],
            code: { language: 'javascript', snippet: 'function lengthOfLongestSubstring(s) { let max = 0, left = 0, seen = new Set(); for (let right = 0; right < s.length; right++) { while (seen.has(s[right])) { seen.delete(s[left]); left++; } seen.add(s[right]); max = Math.max(max, right - left + 1); } return max; }' },
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(min(m,n))'
          }
        ]
      });

    expect(card2Response.status).toBe(201);

    const card3Response = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionName: 'Maximum Subarray',
        category: 'DP',
        difficulty: 'medium',
        tags: ['kadane'],
        solutions: [
          {
            name: 'Kadane\'s Algorithm',
            approachOrder: 0,
            intuition: 'Track maximum sum ending at each position',
            steps: ['Initialize max and current sum', 'Iterate through array', 'Update current sum', 'Update max sum'],
            code: { language: 'javascript', snippet: 'function maxSubArray(nums) { let max = nums[0], current = nums[0]; for (let i = 1; i < nums.length; i++) { current = Math.max(nums[i], current + nums[i]); max = Math.max(max, current); } return max; }' },
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(1)'
          }
        ]
      });

    expect(card3Response.status).toBe(201);

    // Step 4: Get session (verify due cards)
    const sessionResponse = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.cards).toHaveLength(3);
    expect(sessionResponse.body.totalDue).toBe(3);

    const card1Id = sessionResponse.body.cards[0]._id;
    const card2Id = sessionResponse.body.cards[1]._id;
    const card3Id = sessionResponse.body.cards[2]._id;

    // Step 5: Submit reviews with different qualities
    const review1Response = await request(app)
      .post('/api/sessions/review')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cardId: card1Id,
        quality: 'easy'
      });

    expect(review1Response.status).toBe(200);
    expect(review1Response.body.easeFactor).toBeGreaterThan(2.5);
    expect(review1Response.body.interval).toBe(1);

    const review2Response = await request(app)
      .post('/api/sessions/review')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cardId: card2Id,
        quality: 'medium'
      });

    expect(review2Response.status).toBe(200);

    const review3Response = await request(app)
      .post('/api/sessions/review')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cardId: card3Id,
        quality: 'hard'
      });

    expect(review3Response.status).toBe(200);
    expect(review3Response.body.easeFactor).toBeLessThanOrEqual(2.5);

    // Step 6: Verify SR parameters updated correctly
    const updatedCard1 = await Card.findById(card1Id);
    expect(updatedCard1.easeFactor).toBeGreaterThan(2.5);
    expect(updatedCard1.interval).toBe(1);
    expect(updatedCard1.repetition).toBe(1);
    expect(updatedCard1.lastReviewed).toBeDefined();
    expect(updatedCard1.lastQuality).toBe(5);

    const updatedCard3 = await Card.findById(card3Id);
    expect(updatedCard3.easeFactor).toBeLessThanOrEqual(2.5);
    expect(updatedCard3.interval).toBe(1);
    expect(updatedCard3.repetition).toBe(0);
    expect(updatedCard3.lapseCount).toBe(1);

    // Step 7: Get next session (verify scheduling)
    const nextSessionResponse = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(nextSessionResponse.status).toBe(200);
    expect(nextSessionResponse.body.totalDue).toBe(0);

    // Step 8: Check user stats updated
    const statsResponse = await request(app)
      .get('/api/auth/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.totalReviews).toBe(3);
    expect(statsResponse.body.streak).toBe(1);
  });
});