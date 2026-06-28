const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getAllUses,
    getUsesByConsumableId,
    createUse,
    deleteUse
} = require('../controllers/consumableUsesController');

router.use(authenticateToken);

router.get('/', getAllUses);
router.get('/consumable/:consumable_id', getUsesByConsumableId);
router.post('/', createUse);
router.delete('/:id', deleteUse);

module.exports = router;
