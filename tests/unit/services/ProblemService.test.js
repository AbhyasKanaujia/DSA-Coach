const problemService = require('../../../src/services/ProblemService');
const Problem = require('../../../src/models/Problem');
const ProblemContent = require('../../../src/models/ProblemContent');
const User = require('../../../src/models/User');
const mongoose = require('mongoose');

describe('ProblemService', () => {
  let adminUser;

  beforeEach(async () => {
    await Problem.deleteMany({});
    await ProblemContent.deleteMany({});
    adminUser = await User.create({
      email: 'admin@test.com',
      passwordHash: 'hashed',
      name: 'DSA Coach',
      role: 'admin'
    });
  });

  describe('createProblem', () => {
    it('should create a problem with valid data', async () => {
      const data = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        tags: ['array', 'hash-table'],
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use a hash map to store seen numbers',
          steps: ['Create hash map', 'Iterate through array', 'Check complement'],
          codeSnippets: [{
            language: 'javascript',
            code: 'function twoSum(nums, target) { ... }'
          }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      };

      const result = await problemService.createProblem(data, adminUser._id);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Two Sum');
      expect(result.difficulty).toBe('easy');
      expect(result.solutions).toHaveLength(1);
      expect(result.solutions[0].name).toBe('Hash Map');
      expect(result.createdBy.toString()).toBe(adminUser._id.toString());
    });

    it('should throw error when missing required fields', async () => {
      const data = {
        title: 'Two Sum',
        difficulty: 'easy'
      };

      await expect(problemService.createProblem(data, adminUser._id))
        .rejects
        .toThrow('Description is required');
    });

    it('should throw error when no solutions provided', async () => {
      const data = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        solutions: []
      };

      await expect(problemService.createProblem(data, adminUser._id))
        .rejects
        .toThrow('Problem must have at least one solution');
    });

    it('should throw error when duplicate source and sourceId', async () => {
      const data = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use a hash map',
          steps: [],
          codeSnippets: [{
            language: 'javascript',
            code: 'function twoSum(nums, target) { ... }'
          }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      };

      await problemService.createProblem(data, adminUser._id);

      await expect(problemService.createProblem(data, adminUser._id))
        .rejects
        .toThrow('Problem with source leetcode and sourceId 1 already exists');
    });

    it('should normalize solutions with missing fields', async () => {
      const data = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Brute Force',
          intuition: 'Check all pairs',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '...' }],
          timeComplexity: 'O(n²)',
          spaceComplexity: 'O(1)'
        }]
      };

      const result = await problemService.createProblem(data, adminUser._id);

      expect(result.solutions[0].order).toBe(0);
      expect(result.solutions[0].steps).toEqual([]);
      expect(result.solutions[0].timeComplexity).toBe('O(n²)');
      expect(result.solutions[0].spaceComplexity).toBe('O(1)');
    });

    it('should reorder solutions correctly', async () => {
      const data = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        solutions: [
          { name: 'Optimal', order: 2, intuition: 'Best approach', steps: [], codeSnippets: [{ language: 'javascript', code: '// code' }], timeComplexity: 'O(n)', spaceComplexity: 'O(n)' },
          { name: 'Brute Force', order: 0, intuition: 'Check all pairs', steps: [], codeSnippets: [{ language: 'javascript', code: '// code' }], timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' },
          { name: 'Better', order: 1, intuition: 'Two pointers', steps: [], codeSnippets: [{ language: 'javascript', code: '// code' }], timeComplexity: 'O(n log n)', spaceComplexity: 'O(1)' }
        ]
      };

      const result = await problemService.createProblem(data, adminUser._id);

      expect(result.solutions[0].name).toBe('Brute Force');
      expect(result.solutions[0].order).toBe(0);
      expect(result.solutions[1].name).toBe('Better');
      expect(result.solutions[1].order).toBe(1);
      expect(result.solutions[2].name).toBe('Optimal');
      expect(result.solutions[2].order).toBe(2);
    });

    it('should accept custom createdBy', async () => {
      const data = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use a hash map',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      };

      const otherUserId = new mongoose.Types.ObjectId();
      const result = await problemService.createProblem(data, otherUserId);

      expect(result.createdBy.toString()).toBe(otherUserId.toString());
    });
  });

  describe('getProblem', () => {
    it('should return problem with content', async () => {
      const data = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use a hash map',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      };

      const created = await problemService.createProblem(data, adminUser._id);
      const result = await problemService.getProblem(created.id);

      expect(result.id).toBe(created.id);
      expect(result.title).toBe('Two Sum');
      expect(result.solutions).toHaveLength(1);
      expect(result).toHaveProperty('contentVersion');
    });

    it('should throw error when problem not found', async () => {
      await expect(problemService.getProblem('507f1f77bcf86cd799439011'))
        .rejects
        .toThrow('Problem not found');
    });

    it('should throw error when content not found', async () => {
      const problem = await Problem.create({
        title: 'Test',
        description: 'Test',
        difficulty: 'easy',
        source: 'test',
        sourceId: '1',
        createdBy: adminUser._id
      });

      await expect(problemService.getProblem(problem._id.toString()))
        .rejects
        .toThrow('Problem content not found');
    });
  });

  describe('listProblems', () => {
    beforeEach(async () => {
      await problemService.createProblem({
        title: 'Two Sum',
        description: 'Find two numbers',
        difficulty: 'easy',
        tags: ['array', 'hash-table'],
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use hash map',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      }, adminUser._id);

      await problemService.createProblem({
        title: 'Binary Search',
        description: 'Search in sorted array',
        difficulty: 'medium',
        tags: ['binary-search'],
        source: 'leetcode',
        sourceId: '2',
        solutions: [{
          name: 'Binary Search',
          order: 0,
          intuition: 'Divide and conquer',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(log n)',
          spaceComplexity: 'O(1)'
        }]
      }, adminUser._id);

      await problemService.createProblem({
        title: 'Merge Sort',
        description: 'Sort array',
        difficulty: 'hard',
        tags: ['sorting', 'divide-and-conquer'],
        source: 'leetcode',
        sourceId: '3',
        solutions: [{
          name: 'Merge Sort',
          order: 0,
          intuition: 'Divide and merge',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n log n)',
          spaceComplexity: 'O(n)'
        }]
      }, adminUser._id);
    });

    it('should return all problems without filters', async () => {
      const result = await problemService.listProblems();

      expect(result.problems).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by difficulty', async () => {
      const result = await problemService.listProblems({ difficulty: 'easy' });

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].title).toBe('Two Sum');
      expect(result.total).toBe(1);
    });

    it('should filter by tags', async () => {
      const result = await problemService.listProblems({ tags: ['array'] });

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].title).toBe('Two Sum');
    });

    it('should filter by multiple tags', async () => {
      const result = await problemService.listProblems({ tags: ['sorting', 'divide-and-conquer'] });

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].title).toBe('Merge Sort');
    });

    it('should search by title', async () => {
      const result = await problemService.listProblems({ search: 'sum' });

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].title).toBe('Two Sum');
    });

    it('should handle pagination', async () => {
      const result = await problemService.listProblems({}, { page: 1, limit: 2 });

      expect(result.problems).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should return empty array when no matches', async () => {
      const result = await problemService.listProblems({ difficulty: 'extreme' });

      expect(result.problems).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateProblemMetadata', () => {
    let problemId;

    beforeEach(async () => {
      const created = await problemService.createProblem({
        title: 'Two Sum',
        description: 'Find two numbers',
        difficulty: 'easy',
        tags: ['array'],
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use hash map',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      }, adminUser._id);
      problemId = created.id;
    });

    it('should update problem metadata', async () => {
      const result = await problemService.updateProblemMetadata(problemId, {
        title: 'Two Sum Updated',
        difficulty: 'medium'
      }, adminUser._id);

      expect(result.title).toBe('Two Sum Updated');
      expect(result.difficulty).toBe('medium');
    });

    it('should throw error when problem not found', async () => {
      await expect(problemService.updateProblemMetadata('507f1f77bcf86cd799439011', { title: 'New' }, adminUser._id))
        .rejects
        .toThrow('Problem not found');
    });

    it('should throw error when no valid fields to update', async () => {
      await expect(problemService.updateProblemMetadata(problemId, {
        disallowedField: 'should be ignored'
      }, adminUser._id))
        .rejects
        .toThrow('No valid fields to update');
    });
  });

  describe('updateProblemContent', () => {
    let problemId;

    beforeEach(async () => {
      const created = await problemService.createProblem({
        title: 'Two Sum',
        description: 'Find two numbers',
        difficulty: 'easy',
        tags: ['array'],
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use hash map',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      }, adminUser._id);
      problemId = created.id;
    });

    it('should update solutions', async () => {
      const result = await problemService.updateProblemContent(problemId, {
        solutions: [{
          name: 'Brute Force',
          order: 0,
          intuition: 'Check all pairs',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n²)',
          spaceComplexity: 'O(1)'
        }]
      }, adminUser._id);

      expect(result.solutions).toHaveLength(1);
      expect(result.solutions[0].name).toBe('Brute Force');
      expect(result.version).toBeGreaterThan(1);
    });

    it('should throw error when trying to remove all solutions', async () => {
      await expect(problemService.updateProblemContent(problemId, { solutions: [] }, adminUser._id))
        .rejects
        .toThrow('Problem must have at least one solution');
    });

    it('should throw error when problem not found', async () => {
      await expect(problemService.updateProblemContent('507f1f77bcf86cd799439011', {
        solutions: [{
          name: 'Test',
          order: 0,
          intuition: 'Test',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        }]
      }, adminUser._id))
        .rejects
        .toThrow('Problem not found');
    });

    it('should throw error when no valid fields to update', async () => {
      await expect(problemService.updateProblemContent(problemId, {
        disallowedField: 'should be ignored'
      }, adminUser._id))
        .rejects
        .toThrow('No valid fields to update');
    });
  });

  describe('deleteProblem', () => {
    let problemId;

    beforeEach(async () => {
      const created = await problemService.createProblem({
        title: 'Two Sum',
        description: 'Find two numbers',
        difficulty: 'easy',
        source: 'leetcode',
        sourceId: '1',
        solutions: [{
          name: 'Hash Map',
          order: 0,
          intuition: 'Use hash map',
          steps: [],
          codeSnippets: [{ language: 'javascript', code: '// code' }],
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)'
        }]
      }, adminUser._id);
      problemId = created.id;
    });

    it('should delete problem and content', async () => {
      const result = await problemService.deleteProblem(problemId, adminUser._id);

      expect(result.success).toBe(true);

      const problem = await Problem.findById(problemId);
      expect(problem).toBeNull();

      const content = await ProblemContent.findOne({ problemId });
      expect(content).toBeNull();
    });

    it('should throw error when problem not found', async () => {
      await expect(problemService.deleteProblem('507f1f77bcf86cd799439011', adminUser._id))
        .rejects
        .toThrow('Problem not found');
    });
  });

  describe('problemValidator.normalizeSolutions', () => {
    const problemValidator = require('../../../src/utils/problemValidator');

    it('should handle empty solutions array', () => {
      const result = problemValidator.normalizeSolutions([]);

      expect(result).toEqual([]);
    });

    it('should add default values for missing fields', () => {
      const solutions = [{ name: 'Test' }];
      const result = problemValidator.normalizeSolutions(solutions);

      expect(result[0].order).toBe(0);
      expect(result[0].intuition).toBe('');
      expect(result[0].steps).toEqual([]);
      expect(result[0].codeSnippets).toEqual([]);
      expect(result[0].timeComplexity).toBe('N/A');
      expect(result[0].spaceComplexity).toBe('N/A');
    });

    it('should reorder solutions by order field', () => {
      const solutions = [
        { name: 'Third', order: 2 },
        { name: 'First', order: 0 },
        { name: 'Second', order: 1 }
      ];
      const result = problemValidator.normalizeSolutions(solutions);

      expect(result[0].name).toBe('First');
      expect(result[0].order).toBe(0);
      expect(result[1].name).toBe('Second');
      expect(result[1].order).toBe(1);
      expect(result[2].name).toBe('Third');
      expect(result[2].order).toBe(2);
    });

    it('should assign sequential orders when not provided', () => {
      const solutions = [
        { name: 'First' },
        { name: 'Second' },
        { name: 'Third' }
      ];
      const result = problemValidator.normalizeSolutions(solutions);

      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[2].order).toBe(2);
    });
  });
});