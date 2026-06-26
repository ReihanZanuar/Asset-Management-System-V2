const { query } = require('../config/database');

const globalSearch = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const searchTerm = `%${q.trim()}%`;
        const searchLimit = Math.min(parseInt(limit) || 10, 50);

        // Search inventory - has columns: id, code, name, category, condition, location
        const inventoryResult = await query(
            `SELECT id, name, code, category, 'inventory' as type, condition, location
             FROM inventory
             WHERE name ILIKE $1 OR code ILIKE $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [searchTerm, searchLimit]
        );

        // Search loans - join with inventory for item info
        const loansResult = await query(
            `SELECT l.id, COALESCE(i.code, '') as code, l.borrower_name, 'loan' as type, l.status, l.loan_date, l.due_date, l.return_date
             FROM loans l
             LEFT JOIN inventory i ON l.inventory_id = i.id
             WHERE i.code ILIKE $1 OR i.name ILIKE $1 OR l.borrower_name ILIKE $1 OR l.notes ILIKE $1
             ORDER BY l.created_at DESC
             LIMIT $2`,
            [searchTerm, searchLimit]
        );

        // Search consumables - has columns: id, name, quantity, unit, min_threshold, location, last_restock_date
        const consumablesResult = await query(
            `SELECT id, name, 'consumable' as type, quantity, unit, last_restock_date
             FROM consumables
             WHERE name ILIKE $1 OR unit ILIKE $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [searchTerm, searchLimit]
        );

        // Search cannibalization - table is cannibalization_logs
        const cannibalizationResult = await query(
            `SELECT id, source_item_name, destination_item_name, 'cannibalization' as type, reason, date as created_at
             FROM cannibalization_logs
             WHERE source_item_name ILIKE $1 OR destination_item_name ILIKE $1 OR reason ILIKE $1
             ORDER BY date DESC
             LIMIT $2`,
            [searchTerm, searchLimit]
        );

        const results = {
            inventory: inventoryResult.rows,
            loans: loansResult.rows,
            consumables: consumablesResult.rows,
            cannibalization: cannibalizationResult.rows,
            total: inventoryResult.rows.length + loansResult.rows.length + consumablesResult.rows.length + cannibalizationResult.rows.length
        };

        res.json(results);
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    globalSearch
};
