const Collection = require('../models/Collection');

class CollectionRepository {
  async create(collectionData) {
    const collection = new Collection(collectionData);
    return await collection.save();
  }

  async findById(collectionId) {
    return await Collection.findById(collectionId);
  }

  async findAll(filters = {}, pagination = {}) {
    const query = { ...filters };
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    return await Collection.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findPublic(pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    return await Collection.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findByCreator(createdBy, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    return await Collection.find({ createdBy })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async update(collectionId, updates) {
    return await Collection.findByIdAndUpdate(
      collectionId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  async delete(collectionId) {
    return await Collection.findByIdAndDelete(collectionId);
  }

  async addProblem(collectionId, problemId) {
    return await Collection.findByIdAndUpdate(
      collectionId,
      { $addToSet: { problemIds: problemId } },
      { new: true }
    );
  }

  async removeProblem(collectionId, problemId) {
    return await Collection.findByIdAndUpdate(
      collectionId,
      { $pull: { problemIds: problemId } },
      { new: true }
    );
  }

  async count(filters = {}) {
    return await Collection.countDocuments(filters);
  }
}

module.exports = new CollectionRepository();