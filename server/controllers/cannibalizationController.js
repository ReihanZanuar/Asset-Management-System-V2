const { query } = require('../config/database');

// Get all cannibalization logs
const getAllCannibalizationLogs = async (req, res) => {
    try {
        const result = await query(`
            SELECT c.*, 
                   si.name as source_name, si.code as source_code,
                   di.name as dest_name, di.code as dest_code,
                   u.full_name as performed_by_name
            FROM cannibalization_logs c
            LEFT JOIN inventory si ON c.source_inventory_id = si.id
            LEFT JOIN inventory di ON c.destination_inventory_id = di.id
            LEFT JOIN users u ON c.performed_by = u.id
            ORDER BY c.date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Get cannibalization logs error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create cannibalization log
const createCannibalizationLog = async (req, res) => {
    try {
        const { 
            source_inventory_id, 
            source_item_name,
            component_name, 
            destination_inventory_id,
            destination_item_name,
            quantity, 
            date,
            reason, 
            notes 
        } = req.body;

        const result = await query(
            `INSERT INTO cannibalization_logs 
             (source_inventory_id, source_item_name, component_name, destination_inventory_id, 
              destination_item_name, quantity, date, performed_by, reason, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [source_inventory_id, source_item_name, component_name, destination_inventory_id,
             destination_item_name, quantity || 1, date || new Date(), req.user.id, reason, notes]
        );

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREATE', 'cannibalization', result.rows[0].id, `Cannibalized ${component_name} from ${source_item_name}`]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create cannibalization log error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete cannibalization log
const deleteCannibalizationLog = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            'DELETE FROM cannibalization_logs WHERE id = $1 RETURNING component_name',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Log not found' });
        }

        res.json({ message: 'Cannibalization log deleted successfully' });
    } catch (error) {
        console.error('Delete cannibalization log error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAllCannibalizationLogs,
    createCannibalizationLog,
    deleteCannibalizationLog
};
