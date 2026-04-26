const userCollectionRepository = require('../repositories/UserCollectionRepository');
const collectionRepository = require('../repositories/CollectionRepository');
const { NotFoundError, ConflictError } = require('../utils/validators');

class LibraryService {
  async getUserLibrary(userId) {
    return await userCollectionRepository.findAllByUser(userId);
  }

  async addToLibrary(userId, collectionId) {
    const collection = await collectionRepository.findById(collectionId);
    if (!collection) {
      throw new NotFoundError('Collection');
    }

    const existing = await userCollectionRepository.findByUserAndCollection(userId, collectionId);
    if (existing) {
      throw new ConflictError('Collection already in library');
    }

    return await userCollectionRepository.subscribe(userId, collectionId);
  }

  async activateCollection(userId, collectionId) {
    const existing = await userCollectionRepository.findByUserAndCollection(userId, collectionId);
    if (!existing) {
      throw new NotFoundError('Collection in library');
    }
    return await userCollectionRepository.setActive(userId, collectionId, true);
  }

  async deactivateCollection(userId, collectionId) {
    const existing = await userCollectionRepository.findByUserAndCollection(userId, collectionId);
    if (!existing) {
      throw new NotFoundError('Collection in library');
    }
    return await userCollectionRepository.setActive(userId, collectionId, false);
  }

  async unsubscribe(userId, collectionId) {
    const existing = await userCollectionRepository.findByUserAndCollection(userId, collectionId);
    if (!existing) {
      throw new NotFoundError('Collection in library');
    }
    return await userCollectionRepository.unsubscribe(userId, collectionId);
  }
}

module.exports = new LibraryService();