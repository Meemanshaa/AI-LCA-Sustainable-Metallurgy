const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

router.post('/', analysisController.analyzeLCA);

module.exports = router;