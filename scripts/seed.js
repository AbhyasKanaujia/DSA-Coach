/**
 * Idempotent seed for local development.
 *
 *   node scripts/seed.js
 *
 * Creates:
 *   - admin user (admin@dsaflashcard.local / admin123)  — done by ensureAdminUser
 *   - learner user (testuser@example.com / password123)
 *   - 8 problems (classic LeetCode set) + ProblemContent
 *   - 2 collections grouping them
 *   - learner subscribed + active on the "Top 8 Patterns" collection
 *
 * Safe to re-run: looks up by unique keys (email, source+sourceId, collection name).
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/database');
const { ensureAdminUser } = require('../src/config/seed');

const User = require('../src/models/User');
const Problem = require('../src/models/Problem');
const ProblemContent = require('../src/models/ProblemContent');
const Collection = require('../src/models/Collection');
const UserCollection = require('../src/models/UserCollection');

const LEARNER = {
  email: 'testuser@example.com',
  password: 'password123',
  name: 'Test Learner'
};

const PROBLEMS = [
  {
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    companies: ['google', 'amazon'],
    source: 'leetcode',
    sourceId: '1',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    solutions: [
      {
        name: 'Brute Force',
        order: 1,
        intuition: 'Check every pair of indices and return the first pair whose values sum to target.',
        steps: [
          'Iterate i from 0 to n-1',
          'For each i, iterate j from i+1 to n-1',
          'If nums[i] + nums[j] === target, return [i, j]'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) return [i, j];\n    }\n  }\n}'
          }
        ],
        timeComplexity: 'O(n^2)',
        spaceComplexity: 'O(1)'
      },
      {
        name: 'Hash Map (one pass)',
        order: 2,
        intuition: 'For each number, the value we need is target - num. A hash map gives O(1) lookup of "have I seen this complement already?"',
        steps: [
          'Create an empty map of value → index',
          'For each i, compute complement = target - nums[i]',
          'If complement is in the map, return [map[complement], i]',
          'Otherwise store nums[i] → i'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)'
      }
    ]
  },
  {
    title: 'Valid Anagram',
    difficulty: 'easy',
    tags: ['string', 'hash-table', 'sorting'],
    companies: ['amazon', 'bloomberg'],
    source: 'leetcode',
    sourceId: '242',
    description:
      'Given two strings `s` and `t`, return true if t is an anagram of s, and false otherwise.',
    solutions: [
      {
        name: 'Sort and Compare',
        order: 1,
        intuition: 'Anagrams have the same characters; sorting both yields the same string iff they are anagrams.',
        steps: ['If lengths differ, return false', 'Sort both strings', 'Compare character by character'],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  return [...s].sort().join("") === [...t].sort().join("");\n}'
          }
        ],
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(n)'
      },
      {
        name: 'Frequency Counter',
        order: 2,
        intuition: 'Two strings are anagrams iff they have identical character frequencies.',
        steps: [
          'If lengths differ, return false',
          'Build a 26-slot count array from s (+1) and t (-1)',
          'If any slot is non-zero, return false'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  const count = new Array(26).fill(0);\n  for (let i = 0; i < s.length; i++) {\n    count[s.charCodeAt(i) - 97]++;\n    count[t.charCodeAt(i) - 97]--;\n  }\n  return count.every(c => c === 0);\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      }
    ]
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'easy',
    tags: ['array', 'dynamic-programming', 'sliding-window'],
    companies: ['amazon', 'meta', 'apple'],
    source: 'leetcode',
    sourceId: '121',
    description:
      'You are given an array `prices` where prices[i] is the price of a given stock on day i. Maximize your profit by choosing a single day to buy and a different day in the future to sell. Return the max profit, or 0 if none.',
    solutions: [
      {
        name: 'One Pass — Track Min',
        order: 1,
        intuition: 'On each day, the best profit if we sell today is price[today] - min_so_far. Track min and the rolling max profit.',
        steps: [
          'Initialize min = +Infinity, profit = 0',
          'For each price: min = min(min, price); profit = max(profit, price - min)',
          'Return profit'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function maxProfit(prices) {\n  let min = Infinity, profit = 0;\n  for (const p of prices) {\n    if (p < min) min = p;\n    else if (p - min > profit) profit = p - min;\n  }\n  return profit;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      }
    ]
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'easy',
    tags: ['string', 'stack'],
    companies: ['google', 'microsoft'],
    source: 'leetcode',
    sourceId: '20',
    description:
      'Given a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. Brackets must close in the correct order.',
    solutions: [
      {
        name: 'Stack',
        order: 1,
        intuition: 'Every closing bracket must match the most recently opened bracket — that is exactly LIFO, so use a stack.',
        steps: [
          'Map close → open',
          'Iterate chars; push opens onto stack',
          'On close, pop stack and check it matches; otherwise return false',
          'At end, stack must be empty'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function isValid(s) {\n  const pair = { ")": "(", "]": "[", "}": "{" };\n  const stack = [];\n  for (const c of s) {\n    if (c in pair) {\n      if (stack.pop() !== pair[c]) return false;\n    } else {\n      stack.push(c);\n    }\n  }\n  return stack.length === 0;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)'
      }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    tags: ['string', 'hash-table', 'sliding-window'],
    companies: ['amazon', 'meta', 'bloomberg'],
    source: 'leetcode',
    sourceId: '3',
    description:
      'Given a string `s`, find the length of the longest substring without repeating characters.',
    solutions: [
      {
        name: 'Sliding Window with Set',
        order: 1,
        intuition: 'Maintain a window of unique characters; when a duplicate enters, shrink the left edge until the duplicate is gone.',
        steps: [
          'left = 0, set = {}',
          'For right in [0..n): while s[right] in set, remove s[left] and left++',
          'Add s[right] to set; update best = max(best, right - left + 1)'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function lengthOfLongestSubstring(s) {\n  const seen = new Set();\n  let left = 0, best = 0;\n  for (let right = 0; right < s.length; right++) {\n    while (seen.has(s[right])) seen.delete(s[left++]);\n    seen.add(s[right]);\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(min(n, alphabet))'
      },
      {
        name: 'Sliding Window with Last-Seen Map',
        order: 2,
        intuition: 'Skip the inner while-loop by jumping `left` directly past the previous occurrence of the duplicate.',
        steps: [
          'last = {}, left = 0',
          'For each right: if s[right] in last and last[s[right]] >= left, left = last[s[right]] + 1',
          'last[s[right]] = right; update best'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function lengthOfLongestSubstring(s) {\n  const last = new Map();\n  let left = 0, best = 0;\n  for (let right = 0; right < s.length; right++) {\n    if (last.has(s[right]) && last.get(s[right]) >= left) {\n      left = last.get(s[right]) + 1;\n    }\n    last.set(s[right], right);\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(min(n, alphabet))'
      }
    ]
  },
  {
    title: 'Group Anagrams',
    difficulty: 'medium',
    tags: ['array', 'string', 'hash-table'],
    companies: ['amazon', 'uber'],
    source: 'leetcode',
    sourceId: '49',
    description:
      'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.',
    solutions: [
      {
        name: 'Sort Each Word as Key',
        order: 1,
        intuition: 'Anagrams share the same sorted form — use that as a hash key.',
        steps: [
          'For each word, key = sorted(word)',
          'Append the original word to map[key]',
          'Return Object.values(map)'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function groupAnagrams(strs) {\n  const map = new Map();\n  for (const s of strs) {\n    const key = [...s].sort().join("");\n    if (!map.has(key)) map.set(key, []);\n    map.get(key).push(s);\n  }\n  return [...map.values()];\n}'
          }
        ],
        timeComplexity: 'O(n * k log k)',
        spaceComplexity: 'O(n * k)'
      },
      {
        name: 'Frequency Tuple as Key',
        order: 2,
        intuition: 'Avoid the per-word sort by using a 26-length count tuple as the key.',
        steps: [
          'For each word, build a 26-int count array',
          'Stringify it as the key',
          'Group as before'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function groupAnagrams(strs) {\n  const map = new Map();\n  for (const s of strs) {\n    const count = new Array(26).fill(0);\n    for (const c of s) count[c.charCodeAt(0) - 97]++;\n    const key = count.join(",");\n    if (!map.has(key)) map.set(key, []);\n    map.get(key).push(s);\n  }\n  return [...map.values()];\n}'
          }
        ],
        timeComplexity: 'O(n * k)',
        spaceComplexity: 'O(n * k)'
      }
    ]
  },
  {
    title: 'Number of Islands',
    difficulty: 'medium',
    tags: ['graph', 'dfs', 'bfs', 'matrix'],
    companies: ['amazon', 'meta', 'google'],
    source: 'leetcode',
    sourceId: '200',
    description:
      'Given an `m x n` 2D binary grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    solutions: [
      {
        name: 'DFS Flood Fill',
        order: 1,
        intuition: 'Each unvisited land cell starts a new island; flood-fill all connected land cells so we don\'t recount.',
        steps: [
          'For each cell (r, c): if it is land, increment count and DFS to mark connected land as visited (e.g., flip to "0")',
          'DFS visits 4 neighbors recursively',
          'Return count'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function numIslands(grid) {\n  const rows = grid.length, cols = grid[0].length;\n  let count = 0;\n  const dfs = (r, c) => {\n    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;\n    grid[r][c] = "0";\n    dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);\n  };\n  for (let r = 0; r < rows; r++)\n    for (let c = 0; c < cols; c++)\n      if (grid[r][c] === "1") { count++; dfs(r,c); }\n  return count;\n}'
          }
        ],
        timeComplexity: 'O(m * n)',
        spaceComplexity: 'O(m * n) recursion'
      }
    ]
  },
  {
    title: 'Merge Intervals',
    difficulty: 'medium',
    tags: ['array', 'sorting'],
    companies: ['amazon', 'meta', 'google'],
    source: 'leetcode',
    sourceId: '56',
    description:
      'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    solutions: [
      {
        name: 'Sort then Sweep',
        order: 1,
        intuition: 'After sorting by start, an interval either extends the previous one (overlap) or starts a new run.',
        steps: [
          'Sort intervals by start',
          'Iterate; if current.start <= last.end, last.end = max(last.end, current.end)',
          'Otherwise push current as a new interval'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function merge(intervals) {\n  intervals.sort((a, b) => a[0] - b[0]);\n  const out = [];\n  for (const [s, e] of intervals) {\n    if (out.length && s <= out[out.length-1][1]) {\n      out[out.length-1][1] = Math.max(out[out.length-1][1], e);\n    } else {\n      out.push([s, e]);\n    }\n  }\n  return out;\n}'
          }
        ],
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(n)'
      }
    ]
  }
];

const COLLECTIONS = [
  {
    name: 'Top 8 Patterns',
    description: 'A starter set covering hash maps, sliding window, stack, DFS, and sorting — enough for one full review session.',
    sourceIds: ['1', '242', '121', '20', '3', '49', '200', '56']
  },
  {
    name: 'Easy Warm-Up',
    description: 'Four easy problems to reset your confidence before harder sessions.',
    sourceIds: ['1', '242', '121', '20']
  }
];

async function ensureLearner() {
  const existing = await User.findOne({ email: LEARNER.email });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(LEARNER.password, 10);
  const user = await User.create({
    email: LEARNER.email,
    passwordHash,
    name: LEARNER.name,
    role: 'user'
  });
  console.log(`Learner created: ${LEARNER.email} / ${LEARNER.password}`);
  return user;
}

async function ensureProblem(spec, adminId) {
  const existing = await Problem.findOne({ source: spec.source, sourceId: spec.sourceId });
  if (existing) {
    return { problem: existing, created: false };
  }
  const problem = await Problem.create({
    title: spec.title,
    description: spec.description,
    difficulty: spec.difficulty,
    tags: spec.tags,
    companies: spec.companies,
    source: spec.source,
    sourceId: spec.sourceId,
    createdBy: adminId
  });
  await ProblemContent.create({
    problemId: problem._id,
    solutions: spec.solutions
  });
  return { problem, created: true };
}

async function ensureCollection(spec, sourceIdToProblemId, adminId) {
  const problemIds = spec.sourceIds
    .map(sid => sourceIdToProblemId.get(sid))
    .filter(Boolean);
  const existing = await Collection.findOne({ name: spec.name });
  if (existing) {
    existing.description = spec.description;
    existing.problemIds = problemIds;
    await existing.save();
    return { collection: existing, created: false };
  }
  const collection = await Collection.create({
    name: spec.name,
    description: spec.description,
    problemIds,
    createdBy: adminId,
    isPublic: true
  });
  return { collection, created: true };
}

async function ensureSubscription(userId, collectionId) {
  const existing = await UserCollection.findOne({ userId, collectionId });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      await existing.save();
    }
    return { sub: existing, created: false };
  }
  const sub = await UserCollection.create({ userId, collectionId, isActive: true });
  return { sub, created: true };
}

async function main() {
  await connectDB();
  const admin = await ensureAdminUser();
  const learner = await ensureLearner();

  const sourceIdToProblemId = new Map();
  let createdProblems = 0;
  for (const spec of PROBLEMS) {
    const { problem, created } = await ensureProblem(spec, admin._id);
    sourceIdToProblemId.set(spec.sourceId, problem._id);
    if (created) createdProblems++;
  }

  let createdCollections = 0;
  let firstCollectionId = null;
  for (const spec of COLLECTIONS) {
    const { collection, created } = await ensureCollection(spec, sourceIdToProblemId, admin._id);
    if (!firstCollectionId) firstCollectionId = collection._id;
    if (created) createdCollections++;
  }

  const { created: subCreated } = await ensureSubscription(learner._id, firstCollectionId);

  console.log('\nSeed summary:');
  console.log(`  problems:    ${PROBLEMS.length} total, ${createdProblems} newly created`);
  console.log(`  collections: ${COLLECTIONS.length} total, ${createdCollections} newly created`);
  console.log(`  learner:     ${LEARNER.email} / ${LEARNER.password}  (${subCreated ? 'subscribed' : 'already subscribed'} to "${COLLECTIONS[0].name}")`);
  console.log(`  admin:       ${admin.email} (use existing password)`);
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
