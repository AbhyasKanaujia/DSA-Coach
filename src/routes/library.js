const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/LibraryController');
const auth = require('../middleware/auth');

router.get('/', auth, libraryController.getLibrary);
router.post('/:collectionId/add', auth, libraryController.addToLibrary);
router.patch('/:collectionId/activate', auth, libraryController.activateCollection);
router.patch('/:collectionId/deactivate', auth, libraryController.deactivateCollection);

module.exports = router;