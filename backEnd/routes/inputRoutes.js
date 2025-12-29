const express = require('express');
const router = express.Router();
const inputController = require('../controllers/inputController');

router.post('/', inputController.createInput);
router.get('/', inputController.getAllInputs);

module.exports = router;
