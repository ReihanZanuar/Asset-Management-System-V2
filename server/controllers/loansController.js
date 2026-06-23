const { query } = require('../config/database');

// Get all loans
const getAllLoans = async (req, res) => {
    try {
        const { status, search } = req.query;
        
        let sql = `
            SELECT l.*, i.name as item_name, i.code as item_code, i.category
            FROM loans l
            LEFT JOIN inventory i ON l.inventory_id = i.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (status) {
            sql += ` AND l.status = $${paramCount++}`;
            params.push(status);
        }

        if (search) {
            sql += ` AND (l.borrower_name ILIKE $${paramCount} OR i.name ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        sql += ' ORDER BY l.loan_date DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get loans error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create new loan
const createLoan = async (req, res) => {
    try {
        const { inventory_id, borrower_name, borrower_class, borrower_contact, due_date, notes } = req.body;

        // Check if item is available
        const itemCheck = await query(
            'SELECT condition FROM inventory WHERE id = $1',
            [inventory_id]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        if (itemCheck.rows[0].condition !== 'available') {
            return res.status(400).json({ error: 'Item is not available for loan' });
        }

        // Create loan
        const result = await query(
            `INSERT INTO loans (inventory_id, borrower_name, borrower_class, borrower_contact, 
                               due_date, status, condition_on_loan, approved_by, notes)
             VALUES ($1, $2, $3, $4, $5, 'borrowed', 'good', $6, $7) RETURNING *`,
            [inventory_id, borrower_name, borrower_class, borrower_contact, due_date, req.user.id, notes]
        );

        // Update inventory status
        await query(
            'UPDATE inventory SET condition = $1 WHERE id = $2',
            ['borrowed', inventory_id]
        );

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREATE', 'loan', result.rows[0].id, `Created loan for ${borrower_name}`]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create loan error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Return loan
const returnLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { condition_on_return, notes } = req.body;

        const loan = await query('SELECT inventory_id FROM loans WHERE id = $1', [id]);

        if (loan.rows.length === 0) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        // Update loan
        const result = await query(
            `UPDATE loans 
             SET return_date = CURRENT_DATE, status = 'returned', condition_on_return = $1, notes = $2
             WHERE id = $3 RETURNING *`,
            [condition_on_return, notes, id]
        );

        // Update inventory status
        await query(
            'UPDATE inventory SET condition = $1 WHERE id = $2',
            [condition_on_return || 'available', loan.rows[0].inventory_id]
        );

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'UPDATE', 'loan', id, 'Loan returned']
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Return loan error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get active loans
const getActiveLoans = async (req, res) => {
    try {
        const result = await query(`
            SELECT l.*, i.name as item_name, i.code as item_code
            FROM loans l
            JOIN inventory i ON l.inventory_id = i.id
            WHERE l.status = 'borrowed'
            ORDER BY l.due_date ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Get active loans error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get overdue loans
const getOverdueLoans = async (req, res) => {
    try {
        const result = await query(`
            SELECT l.*, i.name as item_name, i.code as item_code
            FROM loans l
            JOIN inventory i ON l.inventory_id = i.id
            WHERE l.status = 'borrowed' AND l.due_date < CURRENT_DATE
            ORDER BY l.due_date ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Get overdue loans error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAllLoans,
    createLoan,
    returnLoan,
    getActiveLoans,
    getOverdueLoans
};
