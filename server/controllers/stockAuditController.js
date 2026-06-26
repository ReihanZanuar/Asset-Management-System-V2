const { query } = require('../config/database');

let tablesReady = false;

const ensureTables = async () => {
    if (tablesReady) return;
    await query(`
        CREATE TABLE IF NOT EXISTS stock_audits (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'open',
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            closed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stock_audit_items (
            id SERIAL PRIMARY KEY,
            audit_id INTEGER NOT NULL REFERENCES stock_audits(id) ON DELETE CASCADE,
            inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
            scanned_code VARCHAR(50) NOT NULL,
            status VARCHAR(30) NOT NULL,
            expected_location VARCHAR(255),
            found_location VARCHAR(255),
            expected_condition VARCHAR(50),
            found_condition VARCHAR(50),
            notes TEXT,
            scanned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (audit_id, scanned_code)
        );

        CREATE INDEX IF NOT EXISTS idx_stock_audit_items_audit_id ON stock_audit_items(audit_id);
        CREATE INDEX IF NOT EXISTS idx_stock_audit_items_status ON stock_audit_items(status);
    `);
    tablesReady = true;
};

const getStatus = (item, foundLocation, foundCondition) => {
    if (!item) return 'unknown';
    if (foundCondition === 'damaged') return 'damaged';
    if (foundLocation && item.location && foundLocation !== item.location) return 'location_mismatch';
    return 'found';
};

const logActivity = async (userId, action, entityId, details) => {
    await query(
        'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [userId, action, 'stock_audit', entityId, details]
    );
};

const getAudits = async (req, res) => {
    try {
        await ensureTables();
        const result = await query(`
            SELECT
                a.*,
                COUNT(i.id)::int as scanned_count,
                COUNT(CASE WHEN i.status = 'found' THEN 1 END)::int as found_count,
                COUNT(CASE WHEN i.status = 'damaged' THEN 1 END)::int as damaged_count,
                COUNT(CASE WHEN i.status = 'location_mismatch' THEN 1 END)::int as mismatch_count,
                COUNT(CASE WHEN i.status = 'unknown' THEN 1 END)::int as unknown_count
            FROM stock_audits a
            LEFT JOIN stock_audit_items i ON i.audit_id = a.id
            GROUP BY a.id
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Get stock audits error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const createAudit = async (req, res) => {
    try {
        await ensureTables();
        const name = (req.body.name || '').trim();
        if (!name) return res.status(400).json({ error: 'Audit name is required' });

        const result = await query(
            'INSERT INTO stock_audits (name, created_by) VALUES ($1, $2) RETURNING *',
            [name, req.user.id]
        );

        await logActivity(req.user.id, 'CREATE', result.rows[0].id, `Started stock opname: ${name}`);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create stock audit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAuditItems = async (req, res) => {
    try {
        await ensureTables();
        const { id } = req.params;
        const result = await query(`
            SELECT ai.*, inv.name, inv.category, inv.code as inventory_code
            FROM stock_audit_items ai
            LEFT JOIN inventory inv ON inv.id = ai.inventory_id
            WHERE ai.audit_id = $1
            ORDER BY ai.scanned_at DESC
        `, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get stock audit items error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const scanAuditItem = async (req, res) => {
    try {
        await ensureTables();
        const { id } = req.params;
        const code = (req.body.code || '').trim();
        const foundLocation = (req.body.found_location || '').trim() || null;
        const foundCondition = req.body.found_condition || null;
        const notes = (req.body.notes || '').trim() || null;

        if (!code) return res.status(400).json({ error: 'Code is required' });

        const audit = await query('SELECT * FROM stock_audits WHERE id = $1', [id]);
        if (!audit.rows.length) return res.status(404).json({ error: 'Audit not found' });
        if (audit.rows[0].status !== 'open') return res.status(400).json({ error: 'Audit is closed' });

        const itemResult = await query('SELECT * FROM inventory WHERE code = $1', [code]);
        const item = itemResult.rows[0];
        const status = getStatus(item, foundLocation, foundCondition);

        const result = await query(`
            INSERT INTO stock_audit_items (
                audit_id, inventory_id, scanned_code, status, expected_location,
                found_location, expected_condition, found_condition, notes, scanned_by, scanned_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP)
            ON CONFLICT (audit_id, scanned_code) DO UPDATE SET
                inventory_id = EXCLUDED.inventory_id,
                status = EXCLUDED.status,
                expected_location = EXCLUDED.expected_location,
                found_location = EXCLUDED.found_location,
                expected_condition = EXCLUDED.expected_condition,
                found_condition = EXCLUDED.found_condition,
                notes = EXCLUDED.notes,
                scanned_by = EXCLUDED.scanned_by,
                scanned_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [
            id,
            item ? item.id : null,
            code,
            status,
            item ? item.location : null,
            foundLocation,
            item ? item.condition : null,
            foundCondition,
            notes,
            req.user.id
        ]);

        await logActivity(req.user.id, 'SCAN', id, `Scanned stock opname item: ${code}`);
        res.json({ ...result.rows[0], name: item ? item.name : null, category: item ? item.category : null });
    } catch (error) {
        console.error('Scan stock audit item error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const closeAudit = async (req, res) => {
    try {
        await ensureTables();
        const { id } = req.params;
        const result = await query(
            `UPDATE stock_audits SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Audit not found' });

        await logActivity(req.user.id, 'CLOSE', result.rows[0].id, `Closed stock opname: ${result.rows[0].name}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Close stock audit error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAudits,
    createAudit,
    getAuditItems,
    scanAuditItem,
    closeAudit
};
