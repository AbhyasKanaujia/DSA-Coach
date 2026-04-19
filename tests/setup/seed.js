const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const Card = require('../../src/models/Card');

const createTestUser = async (overrides = {}) => {
  const passwordHash = await bcrypt.hash('password123', 10);

  const userData = {
    email: `test${Date.now()}@example.com`,
    passwordHash,
    name: 'Test User',
    preferences: {
      dailyGoal: 20,
      maxSessionSize: 10,
      preferredCategories: []
    },
    stats: {
      totalReviews: 0,
      streak: 0,
      lastActiveDate: new Date()
    },
    ...overrides
  };

  const user = new User(userData);
  return await user.save();
};

const createTestCard = async (userId, overrides = {}) => {
  const now = new Date();

  const cardData = {
    userId,
    questionName: 'Two Sum',
    category: 'Array',
    difficulty: 'easy',
    tags: ['hashmap', 'two-pointer'],
    solutions: [
      {
        name: 'Brute Force',
        approachOrder: 0,
        intuition: 'Check all pairs',
        steps: ['Iterate through array', 'Check each pair', 'Return if sum matches'],
        code: {
          language: 'javascript',
          snippet: 'function twoSum(nums, target) { for (let i = 0; i < nums.length; i++) { for (let j = i + 1; j < nums.length; j++) { if (nums[i] + nums[j] === target) return [i, j]; } } }'
        },
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)'
      },
      {
        name: 'Hash Map',
        approachOrder: 1,
        intuition: 'Store seen numbers in a map',
        steps: ['Create empty map', 'Iterate through array', 'Check if complement exists', 'Return indices'],
        code: {
          language: 'javascript',
          snippet: 'function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) return [map.get(complement), i]; map.set(nums[i], i); } }'
        },
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)'
      }
    ],
    selectedSolutionIndex: 0,
    revisionNotes: null,
    easeFactor: 2.5,
    interval: 0,
    repetition: 0,
    dueDate: now,
    lastReviewed: null,
    lastQuality: null,
    lapseCount: 0,
    ...overrides
  };

  const card = new Card(cardData);
  return await card.save();
};

const createTestCards = async (userId, count = 5) => {
  const cards = [];
  const categories = ['Array', 'String', 'Tree', 'DP', 'Graph'];
  const difficulties = ['easy', 'medium', 'hard'];

  for (let i = 0; i < count; i++) {
    const now = new Date();
    now.setDate(now.getDate() + i);

    const card = await createTestCard(userId, {
      questionName: `Test Question ${i + 1}`,
      category: categories[i % categories.length],
      difficulty: difficulties[i % difficulties.length],
      dueDate: now
    });
    cards.push(card);
  }

  return cards;
};

module.exports = {
  createTestUser,
  createTestCard,
  createTestCards
};