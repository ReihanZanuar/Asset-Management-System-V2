const { query } = require('../config/database');

// Get all consumables
const getAllConsumables = async (req, res) => {
    try {
        const { search, low_stock } = req.query;
        
        let sql = 'SELECT * FROM consumables WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (search) {
            sql += ` AND name ILIKE $${paramCount++}`;
            params.push(`%${search}%`);
        }

        if (low_stock === 'true') {
            sql += ' AND quantity <= min_threshold';
        }

        sql += ' ORDER BY name ASC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get consumables error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create new consumable
const createConsumable = async (req, res) => {
    try {
        const { name, quantity, unit, min_threshold, location, notes } = req.body;

        const result = await query(
            `INSERT INTO consumables (name, quantity, unit, min_threshold, location, notes)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, quantity, unit, min_threshold || 10, location, notes]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create consumable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update consumable
const updateConsumable = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, quantity, unit, min_threshold, location, notes } = req.body;

        const result = await query(
            `UPDATE consumables 
             SET name = $1, quantity = $2, unit = $3, min_threshold = $4, location = $5, notes = $6
             WHERE id = $7 RETURNING *`,
            [name, quantity, unit, min_threshold, location, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Consumable not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update consumable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete consumable
const deleteConsumable = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM consumables WHERE id = $1 RETURNING name', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Consumable not found' });
        }

        res.json({ message: 'Consumable deleted successfully' });
    } catch (error) {
        console.error('Delete consumable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get low stock consumables
const getLowStockConsumables = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM consumables WHERE quantity <= min_threshold ORDER BY quantity ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get low stock consumables error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAllConsumables,
    createConsumable,
    updateConsumable,
    deleteConsumable,
    getLowStockConsumables
};
