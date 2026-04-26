const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/SessionController');
const auth = require('../middleware/auth');

router.post('/start', auth, sessionController.startSession);
router.get('/', auth, sessionController.listSessions);
router.get('/:sessionId', auth, sessionController.getSession);
router.post('/:sessionId/complete', auth, sessionController.completeSession);
router.post('/:sessionId/abandon', auth, sessionController.abandonSession);

module.exports = router;