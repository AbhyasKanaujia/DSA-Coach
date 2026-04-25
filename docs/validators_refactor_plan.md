# Validators Refactor Plan

## Current State

Single file: `src/utils/validators.js` (141 lines)
- Error classes (ValidationError, AuthenticationError, NotFoundError, ConflictError)
- Field validators (email, password, name, dailyGoal, maxSessionSize, preferences)
- Model validators (validateUserCreation, validateUserUpdate)

## Refactor Target

Modularize into `src/validators/` directory while maintaining current functionality.

```
src/validators/
├── errors.js          # Custom error classes (reusable across app)
├── fields.js          # Field-level validators (email, password, etc.)
├── User.js            # User model validators (validateUserCreation, validateUserUpdate)
├── index.js           # Re-export all validators for convenience
└── (Future)
    ├── Problem.js     # Problem model validators
    ├── Collection.js  # Collection model validators
    └── Session.js     # Session model validators
```

## Phase 1: Create Directory Structure

1. Create `src/validators/` directory
2. Extract `errors.js` - contains all 4 error classes
3. Extract `fields.js` - contains field validators object and helper validators
4. Extract `User.js` - contains validateUserCreation & validateUserUpdate
5. Create `index.js` - re-exports all validators
6. Update all imports across codebase
7. Delete old `src/utils/validators.js`

## Phase 2: Add Model Validators (When Needed)

- `Problem.js` - validateProblemCreation, validateProblemUpdate
- `Collection.js` - validateCollectionCreation, validateCollectionUpdate
- `Session.js` - validateSessionCreation, validateSessionUpdate

## Benefits

✅ **Single Responsibility** - Each file focuses on one entity
✅ **Scalability** - Easy to add new model validators
✅ **Discoverability** - New developers find validators alongside models
✅ **Maintainability** - Related code lives together
✅ **Reusability** - Error classes and field validators still centralized

## Migration Steps

1. Create new directory structure
2. Move code with no functional changes
3. Update imports in:
   - `src/controllers/AuthController.js`
   - `src/services/UserService.js`
   - Any other files importing from `utils/validators.js`
4. Verify all tests pass
5. Remove old file

## Rollout: Phase 1 Only

Execute Phase 1 now. Phase 2 when adding Problem/Collection/Session validators.
