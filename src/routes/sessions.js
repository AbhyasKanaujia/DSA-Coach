const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/SessionController');
const auth = require('../middleware/auth');

router.get('/', auth, sessionController.getSession);
router.post('/review', auth, sessionController.submitReview);

module.exports = router;