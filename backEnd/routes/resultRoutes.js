const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');

router.post('/', resultController.createResult);
router.get('/', resultController.getAllResults);
router.get('/latest', resultController.getLatestResult);
router.get('/:id', resultController.getResultById);

module.exports = router;
