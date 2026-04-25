const problemRepository = require('../repositories/ProblemRepository');
const problemContentRepository = require('../repositories/ProblemContentRepository');
const collectionRepository = require('../repositories/CollectionRepository');
const problemValidator = require('../utils/problemValidator');
const {
  NotFoundError,
  ConflictError
} = require('../utils/validators');

class ProblemService {
  async createProblem(data, createdBy) {
    const { title, description, difficulty, tags, companies, source, sourceId, solutions } = data;

    problemValidator.validateProblemInput(data);
    problemValidator.validateSolutions(solutions);

    const existingProblem = await problemRepository.findBySource(source, sourceId);
    if (existingProblem) {
      throw new ConflictError(`Problem with source ${source} and sourceId ${sourceId} already exists`);
    }

    const normalizedSolutions = problemValidator.normalizeSolutions(solutions);

    let problem;
    try {
      problem = await problemRepository.create({
        title,
        description,
        difficulty,
        tags: tags || [],
        companies: companies || [],
        source,
        sourceId,
        createdBy
      });

      await problemContentRepository.create({
        problemId: problem._id,
        solutions: normalizedSolutions
      });

      return this.getProblem(problem._id.toString());
    } catch (error) {
      if (problem) {
        await problemRepository.delete(problem._id.toString());
      }
      throw error;
    }
  }

  async getProblem(problemId) {
    const problem = await problemRepository.findById(problemId);
    if (!problem) {
      throw new NotFoundError('Problem');
    }

    const content = await problemContentRepository.findByProblemId(problemId);
    if (!content) {
      throw new NotFoundError('Problem content');
    }

    return {
      id: problem._id.toString(),
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      tags: problem.tags,
      companies: problem.companies,
      source: problem.source,
      sourceId: problem.sourceId,
      createdBy: problem.createdBy,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      solutions: content.solutions,
      contentVersion: content.version
    };
  }

  async listProblems(filters = {}, pagination = {}) {
    const query = {};

    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.companies && filters.companies.length > 0) {
      query.companies = { $in: filters.companies };
    }

    if (filters.search) {
      query.title = { $regex: filters.search, $options: 'i' };
    }

    const problems = await problemRepository.findAll(query, pagination);
    const total = await problemRepository.count(query);

    return {
      problems: problems.map(p => ({
        id: p._id.toString(),
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
        companies: p.companies,
        source: p.source,
        sourceId: p.sourceId,
        createdBy: p.createdBy,
        createdAt: p.createdAt
      })),
      total,
      page: pagination.page || 1,
      limit: pagination.limit || 20
    };
  }

  async updateProblemMetadata(problemId, updates, actor) {
    const problem = await problemRepository.findById(problemId);
    if (!problem) {
      throw new NotFoundError('Problem');
    }

    const allowedFields = ['title', 'description', 'difficulty', 'tags', 'companies'];
    const problemUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'difficulty') {
          problemValidator.validateDifficulty(updates[field]);
        }
        problemUpdates[field] = updates[field];
      }
    }

    if (Object.keys(problemUpdates).length === 0) {
      throw new ConflictError('No valid fields to update');
    }

    await problemRepository.update(problemId, problemUpdates);

    const updatedProblem = await problemRepository.findById(problemId);
    return {
      id: updatedProblem._id.toString(),
      title: updatedProblem.title,
      description: updatedProblem.description,
      difficulty: updatedProblem.difficulty,
      tags: updatedProblem.tags,
      companies: updatedProblem.companies,
      source: updatedProblem.source,
      sourceId: updatedProblem.sourceId,
      createdBy: updatedProblem.createdBy,
      createdAt: updatedProblem.createdAt,
      updatedAt: updatedProblem.updatedAt
    };
  }

  async updateProblemContent(problemId, updates, actor) {
    const problem = await problemRepository.findById(problemId);
    if (!problem) {
      throw new NotFoundError('Problem');
    }

    const contentUpdates = {};

    if (updates.solutions !== undefined) {
      if (updates.solutions.length === 0) {
        throw new ConflictError('Problem must have at least one solution');
      }
      problemValidator.validateSolutions(updates.solutions);
      contentUpdates.solutions = problemValidator.normalizeSolutions(updates.solutions);
    }

    if (Object.keys(contentUpdates).length === 0) {
      throw new ConflictError('No valid fields to update');
    }

    await problemContentRepository.update(problemId, contentUpdates);
    await problemContentRepository.incrementVersion(problemId);

    const content = await problemContentRepository.findByProblemId(problemId);
    return {
      problemId,
      solutions: content.solutions,
      version: content.version
    };
  }

  async deleteProblem(problemId, actor) {
    const problem = await problemRepository.findById(problemId);
    if (!problem) {
      throw new NotFoundError('Problem');
    }

    await collectionRepository.removeProblemFromAll(problemId);
    await problemContentRepository.delete(problemId);
    await problemRepository.delete(problemId);

    return { success: true };
  }
}

module.exports = new ProblemService();