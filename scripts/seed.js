/**
 * Stable seed for local development.
 *
 *   node scripts/seed.js
 *
 * Wipes Problem / ProblemContent / Collection / UserCollection, then creates:
 *   - admin user (admin@dsaflashcard.local / admin123) via ensureAdminUser
 *   - learner user (testuser@example.com / password123)
 *   - 2 collections: "Array Essentials" and "String Essentials"
 *   - 3 problems per collection, covering easy / medium / hard, each with multiple solutions
 *   - learner subscribed + active on "Array Essentials"
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

const ARRAY_PROBLEMS = [
  {
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    companies: ['google', 'amazon'],
    source: 'leetcode',
    sourceId: '1',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. Each input has exactly one solution and you may not use the same element twice.',
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
        intuition: 'For each number, the value we need is target - num. A hash map gives O(1) lookup of the complement we have already seen.',
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
    title: 'Maximum Subarray',
    difficulty: 'medium',
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    companies: ['amazon', 'microsoft', 'bloomberg'],
    source: 'leetcode',
    sourceId: '53',
    description:
      'Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    solutions: [
      {
        name: 'Brute Force',
        order: 1,
        intuition: 'Try every starting index and extend to every ending index, tracking the maximum running sum.',
        steps: [
          'Initialize best = -Infinity',
          'For each i, sum = 0; for each j ≥ i, sum += nums[j]; best = max(best, sum)',
          'Return best'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function maxSubArray(nums) {\n  let best = -Infinity;\n  for (let i = 0; i < nums.length; i++) {\n    let sum = 0;\n    for (let j = i; j < nums.length; j++) {\n      sum += nums[j];\n      if (sum > best) best = sum;\n    }\n  }\n  return best;\n}'
          }
        ],
        timeComplexity: 'O(n^2)',
        spaceComplexity: 'O(1)'
      },
      {
        name: "Kadane's Algorithm",
        order: 2,
        intuition: 'At each index, the best subarray ending here is either nums[i] alone or nums[i] joined to the best ending at i-1. Carry that running max forward.',
        steps: [
          'cur = best = nums[0]',
          'For i in 1..n-1: cur = max(nums[i], cur + nums[i]); best = max(best, cur)',
          'Return best'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function maxSubArray(nums) {\n  let cur = nums[0], best = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    cur = Math.max(nums[i], cur + nums[i]);\n    best = Math.max(best, cur);\n  }\n  return best;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      },
      {
        name: 'Divide and Conquer',
        order: 3,
        intuition: 'The best subarray is either entirely in the left half, entirely in the right half, or crosses the midpoint. Solve each recursively and combine.',
        steps: [
          'Recurse on left half and right half',
          'Compute the best subarray that crosses the midpoint by extending left and right from mid',
          'Return the max of the three'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function maxSubArray(nums) {\n  const solve = (l, r) => {\n    if (l === r) return nums[l];\n    const m = (l + r) >> 1;\n    const left = solve(l, m);\n    const right = solve(m + 1, r);\n    let lSum = -Infinity, s = 0;\n    for (let i = m; i >= l; i--) { s += nums[i]; lSum = Math.max(lSum, s); }\n    let rSum = -Infinity; s = 0;\n    for (let i = m + 1; i <= r; i++) { s += nums[i]; rSum = Math.max(rSum, s); }\n    return Math.max(left, right, lSum + rSum);\n  };\n  return solve(0, nums.length - 1);\n}'
          }
        ],
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(log n)'
      }
    ]
  },
  {
    title: 'Trapping Rain Water',
    difficulty: 'hard',
    tags: ['array', 'two-pointers', 'dynamic-programming', 'stack'],
    companies: ['amazon', 'google', 'meta'],
    source: 'leetcode',
    sourceId: '42',
    description:
      'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    solutions: [
      {
        name: 'Prefix Max + Suffix Max',
        order: 1,
        intuition: 'Water above index i is min(maxLeft[i], maxRight[i]) - height[i]. Precompute both arrays in two passes.',
        steps: [
          'Build leftMax[i] = max of height[0..i]',
          'Build rightMax[i] = max of height[i..n-1]',
          'Sum max(0, min(leftMax[i], rightMax[i]) - height[i]) over all i'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function trap(height) {\n  const n = height.length;\n  if (n === 0) return 0;\n  const left = new Array(n), right = new Array(n);\n  left[0] = height[0];\n  for (let i = 1; i < n; i++) left[i] = Math.max(left[i-1], height[i]);\n  right[n-1] = height[n-1];\n  for (let i = n-2; i >= 0; i--) right[i] = Math.max(right[i+1], height[i]);\n  let total = 0;\n  for (let i = 0; i < n; i++) total += Math.min(left[i], right[i]) - height[i];\n  return total;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)'
      },
      {
        name: 'Two Pointers',
        order: 2,
        intuition: 'Move two pointers inward; whichever side has the smaller running max bounds its own water level, so we can settle it without knowing the other side.',
        steps: [
          'l = 0, r = n-1, leftMax = rightMax = 0, total = 0',
          'While l < r: if height[l] < height[r], update leftMax and add leftMax - height[l]; else mirror on the right',
          'Return total'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function trap(height) {\n  let l = 0, r = height.length - 1;\n  let leftMax = 0, rightMax = 0, total = 0;\n  while (l < r) {\n    if (height[l] < height[r]) {\n      if (height[l] >= leftMax) leftMax = height[l];\n      else total += leftMax - height[l];\n      l++;\n    } else {\n      if (height[r] >= rightMax) rightMax = height[r];\n      else total += rightMax - height[r];\n      r--;\n    }\n  }\n  return total;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      },
      {
        name: 'Monotonic Stack',
        order: 3,
        intuition: 'A descending stack of indices captures pending walls; when a taller bar arrives, it forms basins with the popped indices.',
        steps: [
          'Maintain a stack of indices with non-increasing height',
          'When height[i] > height[stack.top], pop bottom; width = i - newTop - 1; bounded = min(height[newTop], height[i]) - height[popped]',
          'Add bounded * width to total; push i'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function trap(height) {\n  const stack = [];\n  let total = 0;\n  for (let i = 0; i < height.length; i++) {\n    while (stack.length && height[i] > height[stack[stack.length-1]]) {\n      const bottom = stack.pop();\n      if (!stack.length) break;\n      const top = stack[stack.length-1];\n      const width = i - top - 1;\n      const bounded = Math.min(height[top], height[i]) - height[bottom];\n      total += width * bounded;\n    }\n    stack.push(i);\n  }\n  return total;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)'
      }
    ]
  }
];

const STRING_PROBLEMS = [
  {
    title: 'Valid Palindrome',
    difficulty: 'easy',
    tags: ['string', 'two-pointers'],
    companies: ['meta', 'microsoft'],
    source: 'leetcode',
    sourceId: '125',
    description:
      'A phrase is a palindrome if, after converting to lowercase and removing non-alphanumeric characters, it reads the same forward and backward. Return true if `s` is a palindrome.',
    solutions: [
      {
        name: 'Filter then Compare with Reverse',
        order: 1,
        intuition: 'Strip non-alphanumerics, lowercase, and compare the resulting string with its reverse.',
        steps: [
          'Build a filtered lowercase string',
          'Compare it character-by-character to its reverse'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function isPalindrome(s) {\n  const t = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return t === [...t].reverse().join("");\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)'
      },
      {
        name: 'Two Pointers In Place',
        order: 2,
        intuition: 'Walk one pointer from each end, skipping non-alphanumerics, and compare the lowercased characters as we converge.',
        steps: [
          'l = 0, r = n-1',
          'While l < r: advance past non-alphanumerics on each side; compare lowercased chars; bail on mismatch',
          'Return true if pointers crossed'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function isPalindrome(s) {\n  const ok = c => /[a-z0-9]/i.test(c);\n  let l = 0, r = s.length - 1;\n  while (l < r) {\n    while (l < r && !ok(s[l])) l++;\n    while (l < r && !ok(s[r])) r--;\n    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;\n    l++; r--;\n  }\n  return true;\n}'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
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
        name: 'Brute Force',
        order: 1,
        intuition: 'Try every substring; check uniqueness with a set; track the longest valid length.',
        steps: [
          'For each start i, expand j until a duplicate appears',
          'Track best length seen across all (i, j)'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function lengthOfLongestSubstring(s) {\n  let best = 0;\n  for (let i = 0; i < s.length; i++) {\n    const seen = new Set();\n    for (let j = i; j < s.length; j++) {\n      if (seen.has(s[j])) break;\n      seen.add(s[j]);\n    }\n    best = Math.max(best, seen.size);\n  }\n  return best;\n}'
          }
        ],
        timeComplexity: 'O(n^2)',
        spaceComplexity: 'O(min(n, alphabet))'
      },
      {
        name: 'Sliding Window with Set',
        order: 2,
        intuition: 'Maintain a window of unique characters; when a duplicate arrives, shrink the left edge until the duplicate is removed.',
        steps: [
          'left = 0, set = {}',
          'For right in [0..n): while s[right] in set, remove s[left] and left++',
          'Add s[right]; update best = max(best, right - left + 1)'
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
        order: 3,
        intuition: 'Skip the inner loop by jumping `left` directly past the previous occurrence of the duplicate character.',
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
    title: 'Minimum Window Substring',
    difficulty: 'hard',
    tags: ['string', 'hash-table', 'sliding-window'],
    companies: ['amazon', 'meta', 'linkedin'],
    source: 'leetcode',
    sourceId: '76',
    description:
      'Given strings `s` and `t`, return the minimum window substring of `s` that contains every character of `t` (including duplicates). If no such substring exists, return the empty string.',
    solutions: [
      {
        name: 'Sliding Window with Need/Have Counters',
        order: 1,
        intuition: 'Expand right until the window covers all chars of t (have == need); then contract left to find the smallest such window before resuming.',
        steps: [
          'Build need = char counts of t; required = unique chars in t',
          'Expand right; when a char\'s window count matches its need, formed++',
          'While formed === required: record window if smaller; shrink left, decrementing counts and possibly formed--'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function minWindow(s, t) {\n  if (!s || !t || t.length > s.length) return "";\n  const need = new Map();\n  for (const c of t) need.set(c, (need.get(c) || 0) + 1);\n  const required = need.size;\n  const have = new Map();\n  let formed = 0, l = 0;\n  let best = [Infinity, 0, 0];\n  for (let r = 0; r < s.length; r++) {\n    const c = s[r];\n    have.set(c, (have.get(c) || 0) + 1);\n    if (need.has(c) && have.get(c) === need.get(c)) formed++;\n    while (formed === required) {\n      if (r - l + 1 < best[0]) best = [r - l + 1, l, r];\n      const lc = s[l];\n      have.set(lc, have.get(lc) - 1);\n      if (need.has(lc) && have.get(lc) < need.get(lc)) formed--;\n      l++;\n    }\n  }\n  return best[0] === Infinity ? "" : s.slice(best[1], best[2] + 1);\n}'
          }
        ],
        timeComplexity: 'O(|s| + |t|)',
        spaceComplexity: 'O(|s| + |t|)'
      },
      {
        name: 'Filtered Sliding Window',
        order: 2,
        intuition: 'When |t| ≪ |s| and most of s is irrelevant, scan only the indices in s whose char appears in t — same algorithm, fewer steps.',
        steps: [
          'Build need from t',
          'Build a filtered list of [index, char] pairs from s where char is in need',
          'Run the sliding window over the filtered list, mapping back to original indices for window length'
        ],
        codeSnippets: [
          {
            language: 'javascript',
            code: 'function minWindow(s, t) {\n  if (!s || !t || t.length > s.length) return "";\n  const need = new Map();\n  for (const c of t) need.set(c, (need.get(c) || 0) + 1);\n  const filtered = [];\n  for (let i = 0; i < s.length; i++) if (need.has(s[i])) filtered.push([i, s[i]]);\n  const required = need.size;\n  const have = new Map();\n  let formed = 0, l = 0;\n  let best = [Infinity, 0, 0];\n  for (let r = 0; r < filtered.length; r++) {\n    const c = filtered[r][1];\n    have.set(c, (have.get(c) || 0) + 1);\n    if (have.get(c) === need.get(c)) formed++;\n    while (formed === required) {\n      const start = filtered[l][0], end = filtered[r][0];\n      if (end - start + 1 < best[0]) best = [end - start + 1, start, end];\n      const lc = filtered[l][1];\n      have.set(lc, have.get(lc) - 1);\n      if (have.get(lc) < need.get(lc)) formed--;\n      l++;\n    }\n  }\n  return best[0] === Infinity ? "" : s.slice(best[1], best[2] + 1);\n}'
          }
        ],
        timeComplexity: 'O(|s| + |t|)',
        spaceComplexity: 'O(|s| + |t|)'
      }
    ]
  }
];

const COLLECTIONS = [
  {
    name: 'Array Essentials',
    description: 'Three array problems spanning easy, medium, and hard — Two Sum, Maximum Subarray, Trapping Rain Water.',
    problems: ARRAY_PROBLEMS
  },
  {
    name: 'String Essentials',
    description: 'Three string problems spanning easy, medium, and hard — Valid Palindrome, Longest Substring Without Repeating Characters, Minimum Window Substring.',
    problems: STRING_PROBLEMS
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

async function wipe() {
  const [c, p, pc, uc] = await Promise.all([
    Collection.deleteMany({}),
    Problem.deleteMany({}),
    ProblemContent.deleteMany({}),
    UserCollection.deleteMany({})
  ]);
  console.log(`Wiped: ${c.deletedCount} collections, ${p.deletedCount} problems, ${pc.deletedCount} contents, ${uc.deletedCount} subscriptions`);
}

async function createProblem(spec, adminId) {
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
  return problem;
}

async function main() {
  await connectDB();
  const admin = await ensureAdminUser();
  const learner = await ensureLearner();

  await wipe();

  const created = [];
  for (const cspec of COLLECTIONS) {
    const problemIds = [];
    for (const pspec of cspec.problems) {
      const p = await createProblem(pspec, admin._id);
      problemIds.push(p._id);
    }
    const collection = await Collection.create({
      name: cspec.name,
      description: cspec.description,
      problemIds,
      createdBy: admin._id,
      isPublic: true
    });
    created.push(collection);
    console.log(`Created "${cspec.name}" with ${problemIds.length} problems`);
  }

  await UserCollection.create({
    userId: learner._id,
    collectionId: created[0]._id,
    isActive: true
  });

  console.log('\nSeed summary:');
  console.log(`  collections: ${created.length}`);
  console.log(`  problems:    ${COLLECTIONS.reduce((n, c) => n + c.problems.length, 0)}`);
  console.log(`  learner:     ${LEARNER.email} / ${LEARNER.password} (subscribed to "${created[0].name}")`);
  console.log(`  admin:       ${admin.email}`);
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
