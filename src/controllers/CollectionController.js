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
      const collections = await collectionService.listCollections();
      res.json(collections);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CollectionController();