const mongoose = require('mongoose');
const {
  ValidationError
} = require('./validators');

class ProblemValidator {
  validateProblemInput(data) {
    const { title, description, difficulty, source, sourceId } = data;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('Title is required and must be a non-empty string', 'title');
    }

    if (title.length > 200) {
      throw new ValidationError('Title must be less than 200 characters', 'title');
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new ValidationError('Description is required and must be a non-empty string', 'description');
    }

    if (description.length > 5000) {
      throw new ValidationError('Description must be less than 5000 characters', 'description');
    }

    if (!difficulty) {
      throw new ValidationError('Difficulty is required', 'difficulty');
    }

    this.validateDifficulty(difficulty);

    if (!source || typeof source !== 'string' || source.trim().length === 0) {
      throw new ValidationError('Source is required and must be a non-empty string', 'source');
    }

    if (!sourceId || typeof sourceId !== 'string' || sourceId.trim().length === 0) {
      throw new ValidationError('Source ID is required and must be a non-empty string', 'sourceId');
    }
  }

  validateDifficulty(difficulty) {
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      throw new ValidationError(`Difficulty must be one of: ${validDifficulties.join(', ')}`, 'difficulty');
    }
  }

  validateSolutions(solutions) {
    if (!solutions || !Array.isArray(solutions) || solutions.length === 0) {
      throw new ValidationError('Problem must have at least one solution', 'solutions');
    }

    if (solutions.length > 10) {
      throw new ValidationError('Problem cannot have more than 10 solutions', 'solutions');
    }

    solutions.forEach((solution, index) => {
      this._validateSolution(solution, index);
    });
  }

  _validateSolution(solution, index) {
    if (!solution.name || typeof solution.name !== 'string' || solution.name.trim().length === 0) {
      throw new ValidationError(`Solution ${index + 1} must have a name`, `solutions[${index}].name`);
    }

    if (solution.name.length > 100) {
      throw new ValidationError(`Solution ${index + 1} name must be less than 100 characters`, `solutions[${index}].name`);
    }

    if (!solution.intuition || typeof solution.intuition !== 'string' || solution.intuition.trim().length === 0) {
      throw new ValidationError(`Solution ${index + 1} must have intuition`, `solutions[${index}].intuition`);
    }

    if (solution.intuition.length > 2000) {
      throw new ValidationError(`Solution ${index + 1} intuition must be less than 2000 characters`, `solutions[${index}].intuition`);
    }

    if (!solution.codeSnippets || !Array.isArray(solution.codeSnippets) || solution.codeSnippets.length === 0) {
      throw new ValidationError(`Solution ${index + 1} must have at least one code snippet`, `solutions[${index}].codeSnippets`);
    }

    solution.codeSnippets.forEach((snippet, snippetIndex) => {
      this._validateCodeSnippet(snippet, index, snippetIndex);
    });

    if (!solution.timeComplexity || typeof solution.timeComplexity !== 'string' || solution.timeComplexity.trim().length === 0) {
      throw new ValidationError(`Solution ${index + 1} must have time complexity`, `solutions[${index}].timeComplexity`);
    }

    if (!solution.spaceComplexity || typeof solution.spaceComplexity !== 'string' || solution.spaceComplexity.trim().length === 0) {
      throw new ValidationError(`Solution ${index + 1} must have space complexity`, `solutions[${index}].spaceComplexity`);
    }
  }

  _validateCodeSnippet(snippet, solutionIndex, snippetIndex) {
    if (!snippet.language || typeof snippet.language !== 'string' || snippet.language.trim().length === 0) {
      throw new ValidationError(`Solution ${solutionIndex + 1} snippet ${snippetIndex + 1} must have a language`, `solutions[${solutionIndex}].codeSnippets[${snippetIndex}].language`);
    }

    if (!snippet.code || typeof snippet.code !== 'string' || snippet.code.trim().length === 0) {
      throw new ValidationError(`Solution ${solutionIndex + 1} snippet ${snippetIndex + 1} must have code`, `solutions[${solutionIndex}].codeSnippets[${snippetIndex}].code`);
    }

    if (snippet.code.length > 10000) {
      throw new ValidationError(`Solution ${solutionIndex + 1} snippet ${snippetIndex + 1} code must be less than 10000 characters`, `solutions[${solutionIndex}].codeSnippets[${snippetIndex}].code`);
    }
  }

  normalizeSolutions(solutions) {
    return solutions
      .map((sol, idx) => ({
        name: sol.name || `Solution ${idx + 1}`,
        order: sol.order !== undefined ? sol.order : idx,
        intuition: sol.intuition || '',
        steps: sol.steps || [],
        codeSnippets: sol.codeSnippets || [],
        timeComplexity: sol.timeComplexity || 'N/A',
        spaceComplexity: sol.spaceComplexity || 'N/A'
      }))
      .sort((a, b) => a.order - b.order)
      .map((sol, idx) => ({
        ...sol,
        order: idx
      }));
  }

  validateUpdateMetadata(data) {
    const allowedFields = ['title', 'description', 'difficulty', 'tags', 'companies'];
    const hasUpdate = allowedFields.some(field => data[field] !== undefined);
    if (!hasUpdate) {
      throw new ValidationError('No valid fields to update. Allowed: title, description, difficulty, tags, companies', 'fields');
    }

    if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim().length === 0)) {
      throw new ValidationError('Title must be a non-empty string', 'title');
    }

    if (data.description !== undefined && (typeof data.description !== 'string' || data.description.trim().length === 0)) {
      throw new ValidationError('Description must be a non-empty string', 'description');
    }

    if (data.difficulty !== undefined) {
      this.validateDifficulty(data.difficulty);
    }

    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        throw new ValidationError('Tags must be an array', 'tags');
      }
      data.tags.forEach((tag, i) => {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new ValidationError(`Tag at index ${i} must be a non-empty string`, `tags[${i}]`);
        }
      });
    }

    if (data.companies !== undefined) {
      if (!Array.isArray(data.companies)) {
        throw new ValidationError('Companies must be an array', 'companies');
      }
      data.companies.forEach((company, i) => {
        if (typeof company !== 'string' || company.trim().length === 0) {
          throw new ValidationError(`Company at index ${i} must be a non-empty string`, `companies[${i}]`);
        }
      });
    }
  }

  validateUpdateContent(data) {
    if (!data.solutions || !Array.isArray(data.solutions) || data.solutions.length === 0) {
      throw new ValidationError('Solutions array with at least one solution is required', 'solutions');
    }
    this.validateSolutions(data.solutions);
  }

  validateProblemId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid problem ID format', 'problemId');
    }
  }

  validateListFilters({ difficulty, page, limit }) {
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new ValidationError('Difficulty must be one of: easy, medium, hard', 'difficulty');
    }

    if (page !== undefined) {
      const parsed = parseInt(page, 10);
      if (isNaN(parsed) || parsed < 1) {
        throw new ValidationError('Page must be a positive integer', 'page');
      }
    }

    if (limit !== undefined) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        throw new ValidationError('Limit must be between 1 and 100', 'limit');
      }
    }
  }
}

module.exports = new ProblemValidator();