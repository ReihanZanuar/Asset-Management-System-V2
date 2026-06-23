const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    getAllCannibalizationLogs,
    createCannibalizationLog,
    deleteCannibalizationLog
} = require('../controllers/cannibalizationController');

router.use(authenticateToken);

router.get('/', getAllCannibalizationLogs);
router.post('/', createCannibalizationLog);
router.delete('/:id', deleteCannibalizationLog);

module.exports = router;
