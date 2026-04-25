const ProblemController = require('../../../src/controllers/ProblemController');
const problemService = require('../../../src/services/ProblemService');
const { ValidationError, NotFoundError, ConflictError } = require('../../../src/utils/validators');

jest.mock('../../../src/services/ProblemService');

describe('ProblemController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, query: {}, body: {}, userId: 'user123', userRole: 'admin' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  describe('createProblem', () => {
    const validBody = {
      title: 'Two Sum',
      description: 'Find two numbers that add up to target',
      difficulty: 'easy',
      tags: ['array', 'hash-table'],
      companies: ['google', 'amazon'],
      source: 'leetcode',
      sourceId: '1',
      solutions: [{ name: 'Hash Map', intuition: 'Use a hash map', steps: [], codeSnippets: [{ language: 'python', code: 'print(1)' }], timeComplexity: 'O(n)', spaceComplexity: 'O(n)' }]
    };

    it('should create a problem and return 201', async () => {
      const createdProblem = { id: 'prob1', ...validBody };
      problemService.createProblem.mockResolvedValue(createdProblem);

      req.body = validBody;
      await ProblemController.createProblem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdProblem);
    });

    it('should throw ValidationError for missing title', async () => {
      req.body = { ...validBody, title: '' };
      await ProblemController.createProblem(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should throw ValidationError for invalid difficulty', async () => {
      req.body = { ...validBody, difficulty: 'impossible' };
      await ProblemController.createProblem(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should throw ValidationError for invalid problemId', async () => {
      req.params.problemId = 'not-a-valid-id';
      await ProblemController.getProblem(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('getProblem', () => {
    it('should return a problem', async () => {
      const problem = { id: 'prob1', title: 'Two Sum' };
      problemService.getProblem.mockResolvedValue(problem);
      req.params.problemId = '507f1f77bcf86cd799439011';

      await ProblemController.getProblem(req, res, next);

      expect(res.json).toHaveBeenCalledWith(problem);
    });

    it('should call next with NotFoundError when problem not found', async () => {
      problemService.getProblem.mockRejectedValue(new NotFoundError('Problem'));
      req.params.problemId = '507f1f77bcf86cd799439011';

      await ProblemController.getProblem(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('listProblems', () => {
    it('should return paginated list', async () => {
      const result = { problems: [], total: 0, page: 1, limit: 20 };
      problemService.listProblems.mockResolvedValue(result);

      await ProblemController.listProblems(req, res, next);

      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should throw ValidationError for invalid limit', async () => {
      req.query.limit = '999';
      await ProblemController.listProblems(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('updateProblemMetadata', () => {
    it('should update metadata and return result', async () => {
      const updated = { id: 'prob1', title: 'Updated' };
      problemService.updateProblemMetadata.mockResolvedValue(updated);
      req.params.problemId = '507f1f77bcf86cd799439011';
      req.body = { title: 'Updated' };

      await ProblemController.updateProblemMetadata(req, res, next);

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('should throw ValidationError for empty update', async () => {
      req.params.problemId = '507f1f77bcf86cd799439011';
      req.body = {};

      await ProblemController.updateProblemMetadata(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('updateProblemContent', () => {
    it('should update content and return result', async () => {
      const updated = { problemId: 'prob1', solutions: [], version: 2 };
      problemService.updateProblemContent.mockResolvedValue(updated);
      req.params.problemId = '507f1f77bcf86cd799439011';
      req.body = { solutions: [{ name: 'New', intuition: 'I', steps: [], codeSnippets: [{ language: 'python', code: 'x' }], timeComplexity: 'O(1)', spaceComplexity: 'O(1)' }] };

      await ProblemController.updateProblemContent(req, res, next);

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('should throw ValidationError for empty solutions', async () => {
      req.params.problemId = '507f1f77bcf86cd799439011';
      req.body = { solutions: [] };

      await ProblemController.updateProblemContent(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('deleteProblem', () => {
    it('should delete a problem', async () => {
      problemService.deleteProblem.mockResolvedValue({ success: true });
      req.params.problemId = '507f1f77bcf86cd799439011';

      await ProblemController.deleteProblem(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should call next with NotFoundError when problem not found', async () => {
      problemService.deleteProblem.mockRejectedValue(new NotFoundError('Problem'));
      req.params.problemId = '507f1f77bcf86cd799439011';

      await ProblemController.deleteProblem(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});