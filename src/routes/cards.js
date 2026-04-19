const express = require('express');
const router = express.Router();
const cardController = require('../controllers/CardController');
const auth = require('../middleware/auth');

router.post('/', auth, cardController.createCard);
router.get('/', auth, cardController.listCards);
router.get('/:cardId', auth, cardController.getCard);
router.put('/:cardId', auth, cardController.updateCard);
router.delete('/:cardId', auth, cardController.deleteCard);
router.post('/:cardId/solutions', auth, cardController.addSolution);
router.put('/:cardId/solutions/:solutionIndex', auth, cardController.updateSolution);

module.exports = router;