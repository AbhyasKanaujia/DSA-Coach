const collectionRepository = require('../repositories/CollectionRepository');
const { NotFoundError } = require('../utils/validators');

class CollectionService {
  async createCollection(data) {
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
}

module.exports = new CollectionService();