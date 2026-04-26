const mongoose = require('mongoose');
const { ValidationError } = require('./validators');

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'isPublic', 'isEditable'];

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

  validateProblemId(problemId) {
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      throw new ValidationError('Invalid problem ID format', 'problemId');
    }
    return problemId;
  }

  validateUpdateCollection(data) {
    const keys = Object.keys(data);
    const allowed = keys.filter(k => ALLOWED_UPDATE_FIELDS.includes(k));
    if (allowed.length === 0) {
      throw new ValidationError('At least one updatable field is required (name, description, isPublic, isEditable)', 'updates');
    }

    const invalid = keys.filter(k => !ALLOWED_UPDATE_FIELDS.includes(k));
    if (invalid.length > 0) {
      throw new ValidationError(`Cannot update field(s): ${invalid.join(', ')}`, 'updates');
    }

    const validated = {};

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new ValidationError('Collection name cannot be empty', 'name');
      }
      validated.name = data.name.trim();
    }

    if (data.description !== undefined) {
      validated.description = typeof data.description === 'string' ? data.description.trim() : '';
    }

    if (data.isPublic !== undefined) {
      if (typeof data.isPublic !== 'boolean') {
        throw new ValidationError('isPublic must be a boolean', 'isPublic');
      }
      validated.isPublic = data.isPublic;
    }

    if (data.isEditable !== undefined) {
      if (typeof data.isEditable !== 'boolean') {
        throw new ValidationError('isEditable must be a boolean', 'isEditable');
      }
      validated.isEditable = data.isEditable;
    }

    return validated;
  }
}

module.exports = new CollectionValidator();