const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/CollectionController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

router.post('/', auth, requireAdmin, collectionController.createCollection);
router.get('/', auth, collectionController.listCollections);
router.get('/:collectionId', auth, collectionController.getCollection);

module.exports = router;