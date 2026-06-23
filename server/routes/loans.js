const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    getAllLoans, 
    createLoan, 
    returnLoan,
    getActiveLoans,
    getOverdueLoans
} = require('../controllers/loansController');

router.use(authenticateToken);

router.get('/', getAllLoans);
router.get('/active', getActiveLoans);
router.get('/overdue', getOverdueLoans);
router.post('/', createLoan);
router.put('/:id/return', returnLoan);

module.exports = router;
