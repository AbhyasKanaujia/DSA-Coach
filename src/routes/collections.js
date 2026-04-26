const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/CollectionController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

router.post('/', auth, requireAdmin, collectionController.createCollection);
router.get('/', auth, collectionController.listCollections);
router.get('/:collectionId', auth, collectionController.getCollection);
router.put('/:collectionId', auth, requireAdmin, collectionController.updateCollection);
router.delete('/:collectionId', auth, requireAdmin, collectionController.deleteCollection);
router.post('/:collectionId/problems/:problemId', auth, requireAdmin, collectionController.addProblemToCollection);
router.delete('/:collectionId/problems/:problemId', auth, requireAdmin, collectionController.removeProblemFromCollection);

module.exports = router;