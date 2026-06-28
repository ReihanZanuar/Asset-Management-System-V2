const { query } = require('../config/database');

// Get all consumable uses
const getAllUses = async (req, res) => {
    try {
        const { search, consumable_id } = req.query;

        let sql = `
            SELECT cu.*, c.name as consumable_name, c.unit, u.full_name as used_by_name
            FROM consumable_uses cu
            LEFT JOIN consumables c ON cu.consumable_id = c.id
            LEFT JOIN users u ON cu.used_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (consumable_id) {
            sql += ` AND cu.consumable_id = $${paramCount++}`;
            params.push(consumable_id);
        }

        if (search) {
            sql += ` AND c.name ILIKE $${paramCount++}`;
            params.push(`%${search}%`);
        }

        sql += ' ORDER BY cu.used_at DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get consumable uses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get uses by consumable ID
const getUsesByConsumableId = async (req, res) => {
    try {
        const { consumable_id } = req.params;

        const result = await query(
            `SELECT cu.*, u.full_name as used_by_name, c.unit
             FROM consumable_uses cu
             LEFT JOIN users u ON cu.used_by = u.id
             LEFT JOIN consumables c ON cu.consumable_id = c.id
             WHERE cu.consumable_id = $1
             ORDER BY cu.used_at DESC`,
            [consumable_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get uses by consumable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create new use record
const createUse = async (req, res) => {
    try {
        const { consumable_id, quantity_used, location, notes } = req.body;

        // Validate consumable exists
        const consumableCheck = await query(
            'SELECT quantity, unit FROM consumables WHERE id = $1',
            [consumable_id]
        );

        if (consumableCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Consumable not found' });
        }

        const currentQuantity = consumableCheck.rows[0].quantity;

        // Check if quantity used is valid
        if (quantity_used <= 0) {
            return res.status(400).json({ error: 'Quantity used must be greater than 0' });
        }

        if (quantity_used > currentQuantity) {
            return res.status(400).json({ error: 'Quantity used exceeds available quantity' });
        }

        // Create use record
        const result = await query(
            `INSERT INTO consumable_uses (consumable_id, quantity_used, location, notes, used_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [consumable_id, quantity_used, location, notes, req.user.id]
        );

        // Update consumable quantity
        await query(
            'UPDATE consumables SET quantity = quantity - $1 WHERE id = $2',
            [quantity_used, consumable_id]
        );

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREATE', 'consumable_use', result.rows[0].id, `Recorded usage of ${quantity_used} units`]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create use error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete use record (revert)
const deleteUse = async (req, res) => {
    try {
        const { id } = req.params;

        // Get use record
        const useRecord = await query(
            'SELECT consumable_id, quantity_used FROM consumable_uses WHERE id = $1',
            [id]
        );

        if (useRecord.rows.length === 0) {
            return res.status(404).json({ error: 'Use record not found' });
        }

        const { consumable_id, quantity_used } = useRecord.rows[0];

        // Delete use record
        await query('DELETE FROM consumable_uses WHERE id = $1', [id]);

        // Restore consumable quantity
        await query(
            'UPDATE consumables SET quantity = quantity + $1 WHERE id = $2',
            [quantity_used, consumable_id]
        );

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'DELETE', 'consumable_use', id, `Deleted usage record - restored ${quantity_used} units`]
        );

        res.json({ message: 'Use record deleted successfully' });
    } catch (error) {
        console.error('Delete use error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAllUses,
    getUsesByConsumableId,
    createUse,
    deleteUse
};
