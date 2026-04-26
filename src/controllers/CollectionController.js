const collectionService = require('../services/CollectionService');
const collectionValidator = require('../utils/collectionValidator');

class CollectionController {
  async createCollection(req, res, next) {
    try {
      const { name, problemIds } = collectionValidator.validateCreateCollection(req.body);
      const collection = await collectionService.createCollection({
        name,
        problemIds,
        createdBy: req.userId,
        isPublic: true
      });
      res.status(201).json(collection);
    } catch (error) {
      next(error);
    }
  }

  async getCollection(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      const collection = await collectionService.getCollection(collectionId);
      res.json(collection);
    } catch (error) {
      next(error);
    }
  }

  async listCollections(req, res, next) {
    try {
      const pagination = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20
      };
      const collections = await collectionService.listCollections(pagination);
      res.json(collections);
    } catch (error) {
      next(error);
    }
  }

  async updateCollection(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      const updates = collectionValidator.validateUpdateCollection(req.body);
      const collection = await collectionService.updateCollection(collectionId, updates);
      res.json(collection);
    } catch (error) {
      next(error);
    }
  }

  async deleteCollection(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      await collectionService.deleteCollection(collectionId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  async addProblemToCollection(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      const problemId = collectionValidator.validateProblemId(req.params.problemId);
      const collection = await collectionService.addProblemToCollection(collectionId, problemId);
      res.json(collection);
    } catch (error) {
      next(error);
    }
  }

  async removeProblemFromCollection(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      const problemId = collectionValidator.validateProblemId(req.params.problemId);
      const collection = await collectionService.removeProblemFromCollection(collectionId, problemId);
      res.json(collection);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CollectionController();