const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/ReviewController');
const auth = require('../middleware/auth');

router.post('/', auth, reviewController.submitReview);

module.exports = router;