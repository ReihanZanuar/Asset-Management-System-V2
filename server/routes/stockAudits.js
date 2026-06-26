const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getAudits,
    createAudit,
    getAuditItems,
    scanAuditItem,
    closeAudit
} = require('../controllers/stockAuditController');

router.use(authenticateToken);

router.get('/', getAudits);
router.post('/', createAudit);
router.get('/:id/items', getAuditItems);
router.post('/:id/scan', scanAuditItem);
router.put('/:id/close', closeAudit);

module.exports = router;
