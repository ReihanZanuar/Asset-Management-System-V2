const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    getAllConsumables,
    createConsumable,
    updateConsumable,
    deleteConsumable,
    getLowStockConsumables
} = require('../controllers/consumablesController');

router.use(authenticateToken);

router.get('/', getAllConsumables);
router.get('/low-stock', getLowStockConsumables);
router.post('/', createConsumable);
router.put('/:id', updateConsumable);
router.delete('/:id', deleteConsumable);

module.exports = router;
