const libraryService = require('../services/LibraryService');
const collectionValidator = require('../utils/collectionValidator');

class LibraryController {
  async getLibrary(req, res, next) {
    try {
      const library = await libraryService.getUserLibrary(req.userId);
      res.json(library);
    } catch (error) {
      next(error);
    }
  }

  async addToLibrary(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      const userCollection = await libraryService.addToLibrary(req.userId, collectionId);
      res.status(201).json(userCollection);
    } catch (error) {
      next(error);
    }
  }

  async activateCollection(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      const userCollection = await libraryService.activateCollection(req.userId, collectionId);
      res.json(userCollection);
    } catch (error) {
      next(error);
    }
  }

  async deactivateCollection(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      const userCollection = await libraryService.deactivateCollection(req.userId, collectionId);
      res.json(userCollection);
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const collectionId = collectionValidator.validateCollectionId(req.params.collectionId);
      await libraryService.unsubscribe(req.userId, collectionId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LibraryController();