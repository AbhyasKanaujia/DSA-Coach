const express = require('express');
const router = express.Router();
const problemController = require('../controllers/ProblemController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// Admin-only routes
router.post('/', auth, requireAdmin, problemController.createProblem);
router.put('/:problemId/metadata', auth, requireAdmin, problemController.updateProblemMetadata);
router.put('/:problemId/content', auth, requireAdmin, problemController.updateProblemContent);
router.delete('/:problemId', auth, requireAdmin, problemController.deleteProblem);

// Authenticated user routes
router.get('/', auth, problemController.listProblems);
router.get('/:problemId', auth, problemController.getProblem);

module.exports = router;