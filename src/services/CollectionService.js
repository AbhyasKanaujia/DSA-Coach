const collectionRepository = require('../repositories/CollectionRepository');
const userCollectionRepository = require('../repositories/UserCollectionRepository');
const problemRepository = require('../repositories/ProblemRepository');
const { NotFoundError, ValidationError } = require('../utils/validators');

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'isPublic', 'isEditable'];

class CollectionService {
  async createCollection(data) {
    if (data.problemIds && data.problemIds.length > 0) {
      const found = await problemRepository.findByIds(data.problemIds);
      const foundIds = new Set(found.map(p => p._id.toString()));
      const missing = data.problemIds.filter(id => !foundIds.has(id.toString()));
      if (missing.length > 0) {
        throw new ValidationError(`Problem(s) not found: ${missing.join(', ')}`, 'problemIds');
      }
    }
    return await collectionRepository.create(data);
  }

  async getCollection(collectionId) {
    const collection = await collectionRepository.findById(collectionId);
    if (!collection) {
      throw new NotFoundError('Collection');
    }
    return collection;
  }

  async listCollections(pagination = {}) {
    return await collectionRepository.findPublic(pagination);
  }

  async updateCollection(collectionId, updates) {
    const collection = await collectionRepository.findById(collectionId);
    if (!collection) {
      throw new NotFoundError('Collection');
    }

    const invalidKeys = Object.keys(updates).filter(k => !ALLOWED_UPDATE_FIELDS.includes(k));
    if (invalidKeys.length > 0) {
      throw new ValidationError(`Cannot update field(s): ${invalidKeys.join(', ')}`, 'updates');
    }

    return await collectionRepository.update(collectionId, updates);
  }

  async deleteCollection(collectionId) {
    const collection = await collectionRepository.findById(collectionId);
    if (!collection) {
      throw new NotFoundError('Collection');
    }

    await userCollectionRepository.unsubscribeAll(collectionId);
    return await collectionRepository.delete(collectionId);
  }

  async addProblemToCollection(collectionId, problemId) {
    const collection = await collectionRepository.findById(collectionId);
    if (!collection) {
      throw new NotFoundError('Collection');
    }

    const problem = await problemRepository.findById(problemId);
    if (!problem) {
      throw new NotFoundError('Problem');
    }

    return await collectionRepository.addProblem(collectionId, problemId);
  }

  async removeProblemFromCollection(collectionId, problemId) {
    const collection = await collectionRepository.findById(collectionId);
    if (!collection) {
      throw new NotFoundError('Collection');
    }

    return await collectionRepository.removeProblem(collectionId, problemId);
  }
}

module.exports = new CollectionService();