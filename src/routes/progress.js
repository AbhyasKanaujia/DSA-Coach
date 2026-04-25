const express = require('express');
const router = express.Router();
const progressController = require('../controllers/ProgressController');
const auth = require('../middleware/auth');

router.get('/', auth, progressController.getProgress);

module.exports = router;