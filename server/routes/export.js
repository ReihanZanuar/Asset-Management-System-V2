const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    exportInventory,
    exportLoans,
    exportConsumables,
    exportStockAudit
} = require('../controllers/exportController');

// All export routes require authentication
router.use(authenticateToken);

// Export routes
router.get('/inventory', exportInventory);
router.get('/loans', exportLoans);
router.get('/consumables', exportConsumables);
router.get('/stock-audits/:id', exportStockAudit);

module.exports = router;
