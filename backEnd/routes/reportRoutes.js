const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/generate', reportController.generateReport);
router.get('/download/:reportId', reportController.downloadReport);
router.get('/', reportController.getAllReports);

module.exports = router;
