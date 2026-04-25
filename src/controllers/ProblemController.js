const problemService = require('../services/ProblemService');
const problemValidator = require('../utils/problemValidator');
const mongoose = require('mongoose');

class ProblemController {
  async createProblem(req, res, next) {
    try {
      const { title, description, difficulty, tags, companies, source, sourceId, solutions } = req.body;

      problemValidator.validateProblemInput(req.body);
      problemValidator.validateSolutions(solutions);

      const normalizedSolutions = problemValidator.normalizeSolutions(solutions);

      const problem = await problemService.createProblem(
        { title, description, difficulty, tags, companies, source, sourceId, solutions: normalizedSolutions },
        req.userId
      );

      res.status(201).json(problem);
    } catch (error) {
      next(error);
    }
  }

  async getProblem(req, res, next) {
    try {
      problemValidator.validateProblemId(req.params.problemId);

      const problem = await problemService.getProblem(req.params.problemId);
      res.json(problem);
    } catch (error) {
      next(error);
    }
  }

  async updateProblemMetadata(req, res, next) {
    try {
      problemValidator.validateProblemId(req.params.problemId);
      problemValidator.validateUpdateMetadata(req.body);

      const problem = await problemService.updateProblemMetadata(
        req.params.problemId,
        req.body,
        req.userId
      );
      res.json(problem);
    } catch (error) {
      next(error);
    }
  }

  async updateProblemContent(req, res, next) {
    try {
      problemValidator.validateProblemId(req.params.problemId);
      problemValidator.validateUpdateContent(req.body);

      const content = await problemService.updateProblemContent(
        req.params.problemId,
        req.body,
        req.userId
      );
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  async deleteProblem(req, res, next) {
    try {
      problemValidator.validateProblemId(req.params.problemId);

      const result = await problemService.deleteProblem(req.params.problemId, req.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async listProblems(req, res, next) {
    try {
      const { difficulty, tags, companies, search, page = 1, limit = 20 } = req.query;

      problemValidator.validateListFilters({ difficulty, page, limit });

      const filters = {};
      if (difficulty) filters.difficulty = difficulty;
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
      if (companies) filters.companies = Array.isArray(companies) ? companies : [companies];
      if (search) filters.search = search;

      const pagination = { page: parseInt(page), limit: parseInt(limit) };

      const result = await problemService.listProblems(filters, pagination);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProblemController();