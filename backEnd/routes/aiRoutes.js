const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai/lca
router.post('/lca', aiController.runLCA);

// POST /api/ai/smart-fill
router.post('/smart-fill', aiController.smartFill);

module.exports = router;
