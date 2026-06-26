const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

// Global search endpoint
router.get('/', authenticateToken, globalSearch);

module.exports = router;

