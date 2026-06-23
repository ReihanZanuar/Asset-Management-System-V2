const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    getDashboardMetrics,
    getAnalyticsReports
} = require('../controllers/analyticsController');

router.use(authenticateToken);

router.get('/dashboard', getDashboardMetrics);
router.get('/reports', getAnalyticsReports);

module.exports = router;
