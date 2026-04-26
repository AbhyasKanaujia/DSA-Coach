const mongoose = require('mongoose');
const { ValidationError } = require('./validators');

class CollectionValidator {
  validateCreateCollection(data) {
    const { name, problemIds } = data;

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Collection name is required', 'name');
    }

    const validatedProblemIds = [];
    if (problemIds && Array.isArray(problemIds)) {
      for (const pid of problemIds) {
        if (!mongoose.Types.ObjectId.isValid(pid)) {
          throw new ValidationError('Invalid problem ID in problemIds', 'problemIds');
        }
        validatedProblemIds.push(pid);
      }
    }

    return { name: name.trim(), problemIds: validatedProblemIds };
  }

  validateCollectionId(collectionId) {
    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      throw new ValidationError('Invalid collection ID format', 'collectionId');
    }
    return collectionId;
  }
}

module.exports = new CollectionValidator();