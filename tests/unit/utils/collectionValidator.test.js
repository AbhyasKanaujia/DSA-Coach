const collectionValidator = require('../../../src/utils/collectionValidator');
const { ValidationError } = require('../../../src/utils/validators');
const mongoose = require('mongoose');

describe('CollectionValidator', () => {
  describe('validateCreateCollection', () => {
    it('should return trimmed name and validated problemIds', () => {
      const id1 = new mongoose.Types.ObjectId();
      const id2 = new mongoose.Types.ObjectId();
      const result = collectionValidator.validateCreateCollection({
        name: '  Neetcode 150  ',
        problemIds: [id1.toString(), id2.toString()]
      });

      expect(result.name).toBe('Neetcode 150');
      expect(result.problemIds).toHaveLength(2);
    });

    it('should throw ValidationError for missing name', () => {
      expect(() => collectionValidator.validateCreateCollection({}))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'name' }));
    });

    it('should throw ValidationError for whitespace-only name', () => {
      expect(() => collectionValidator.validateCreateCollection({ name: '   ' }))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'name' }));
    });

    it('should allow empty problemIds array', () => {
      const result = collectionValidator.validateCreateCollection({ name: 'Empty', problemIds: [] });
      expect(result.problemIds).toEqual([]);
    });

    it('should allow omitted problemIds', () => {
      const result = collectionValidator.validateCreateCollection({ name: 'No PIDs' });
      expect(result.problemIds).toEqual([]);
    });

    it('should throw ValidationError for invalid ObjectId in problemIds', () => {
      expect(() => collectionValidator.validateCreateCollection({ name: 'Bad', problemIds: ['not-an-id'] }))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'problemIds' }));
    });

    it('should ignore non-array problemIds', () => {
      const result = collectionValidator.validateCreateCollection({ name: 'String', problemIds: 'bad' });
      expect(result.problemIds).toEqual([]);
    });
  });

  describe('validateCollectionId', () => {
    it('should pass for valid ObjectId', () => {
      const id = new mongoose.Types.ObjectId();
      expect(collectionValidator.validateCollectionId(id.toString())).toBe(id.toString());
    });

    it('should throw ValidationError for invalid format', () => {
      expect(() => collectionValidator.validateCollectionId('abc'))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'collectionId' }));
    });
  });

  describe('validateProblemId', () => {
    it('should pass for valid ObjectId', () => {
      const id = new mongoose.Types.ObjectId();
      expect(collectionValidator.validateProblemId(id.toString())).toBe(id.toString());
    });

    it('should throw ValidationError for invalid format', () => {
      expect(() => collectionValidator.validateProblemId('not-valid'))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'problemId' }));
    });
  });

  describe('validateUpdateCollection', () => {
    it('should validate and return allowed fields', () => {
      const result = collectionValidator.validateUpdateCollection({
        name: 'Updated Name',
        description: 'New description',
        isPublic: false,
        isEditable: true
      });

      expect(result).toEqual({
        name: 'Updated Name',
        description: 'New description',
        isPublic: false,
        isEditable: true
      });
    });

    it('should throw when no allowed fields provided', () => {
      expect(() => collectionValidator.validateUpdateCollection({}))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'updates' }));
    });

    it('should reject disallowed fields like problemIds', () => {
      expect(() => collectionValidator.validateUpdateCollection({ problemIds: ['abc'] }))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'updates' }));
    });

    it('should reject empty name', () => {
      expect(() => collectionValidator.validateUpdateCollection({ name: '   ' }))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'name' }));
    });

    it('should reject non-boolean isPublic', () => {
      expect(() => collectionValidator.validateUpdateCollection({ isPublic: 'yes' }))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'isPublic' }));
    });

    it('should reject non-boolean isEditable', () => {
      expect(() => collectionValidator.validateUpdateCollection({ isEditable: 1 }))
        .toThrow(expect.objectContaining({ name: 'ValidationError', field: 'isEditable' }));
    });

    it('should trim name', () => {
      const result = collectionValidator.validateUpdateCollection({ name: '  Trimmed  ' });
      expect(result.name).toBe('Trimmed');
    });

    it('should trim description', () => {
      const result = collectionValidator.validateUpdateCollection({ description: '  desc  ' });
      expect(result.description).toBe('desc');
    });

    it('should handle partial updates with only name', () => {
      const result = collectionValidator.validateUpdateCollection({ name: 'Only Name' });
      expect(result).toEqual({ name: 'Only Name' });
    });
  });
});