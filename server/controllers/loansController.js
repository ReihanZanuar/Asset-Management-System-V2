const { query } = require('../config/database');
const { sendWhatsApp } = require('../services/waService');


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
            'SELECT name, code, condition FROM inventory WHERE id = $1',
            [inventory_id]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        if (itemCheck.rows[0].condition !== 'available') {
            return res.status(400).json({ error: 'Item is not available for loan' });
        }

        const item = itemCheck.rows[0];

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

        // Send WhatsApp notification to admin
        const adminWa = process.env.ADMIN_WA_NUMBER;
        if (adminWa) {
            const formattedDate = new Date(due_date).toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const message = `📋 *PEMINJAMAN BARU*\n\n` +
                `👤 Peminjam: *${borrower_name}*\n` +
                `🏫 Kelas: ${borrower_class || '-'}\n` +
                `📦 Barang: ${item.name} (${item.code})\n` +
                `📅 Jatuh Tempo: ${formattedDate}\n` +
                `📞 Kontak: ${borrower_contact || '-'}\n\n` +
                `_Notifikasi otomatis dari AMS-SMK_`;
            
            sendWhatsApp(adminWa, message)
                .then(response => console.log('WA admin notif sent:', response))
                .catch(err => console.error('WA admin notif error:', err));
        }

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

        const loanCheck = await query(`
            SELECT l.*, i.name as item_name, i.code as item_code 
            FROM loans l 
            JOIN inventory i ON l.inventory_id = i.id 
            WHERE l.id = $1
        `, [id]);

        if (loanCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        const loan = loanCheck.rows[0];

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
            [condition_on_return || 'available', loan.inventory_id]
        );

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'UPDATE', 'loan', id, 'Loan returned']
        );

        // Send WhatsApp notification to admin
        const adminWa = process.env.ADMIN_WA_NUMBER;
        if (adminWa) {
            const formattedDate = new Date().toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const message = `✅ *BARANG DIKEMBALIKAN*\n\n` +
                `👤 Peminjam: *${loan.borrower_name}*\n` +
                `🏫 Kelas: ${loan.borrower_class || '-'}\n` +
                `📦 Barang: ${loan.item_name} (${loan.item_code})\n` +
                `🔍 Kondisi: ${condition_on_return || 'baik'}\n` +
                `📅 Tanggal Kembali: ${formattedDate}\n\n` +
                `_Notifikasi otomatis dari AMS-SMK_`;
            
            sendWhatsApp(adminWa, message)
                .then(response => console.log('WA admin notif sent:', response))
                .catch(err => console.error('WA admin notif error:', err));
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Return loan error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Manually send WhatsApp reminder (to admin)
const remindLoan = async (req, res) => {
    try {
        const { id } = req.params;

        const loanCheck = await query(`
            SELECT l.*, i.name as item_name, i.code as item_code 
            FROM loans l 
            JOIN inventory i ON l.inventory_id = i.id 
            WHERE l.id = $1
        `, [id]);

        if (loanCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        const loan = loanCheck.rows[0];

        if (loan.status !== 'borrowed') {
            return res.status(400).json({ error: 'Item has already been returned' });
        }

        const adminWa = process.env.ADMIN_WA_NUMBER;
        if (!adminWa) {
            return res.status(400).json({ error: 'ADMIN_WA_NUMBER not configured in .env' });
        }

        const isOverdue = new Date(loan.due_date) < new Date();
        const formattedDate = new Date(loan.due_date).toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // Calculate overdue days
        const diffMs = new Date() - new Date(loan.due_date);
        const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let message = '';
        if (isOverdue) {
            message = `⚠️ *ALERT OVERDUE* ⚠️\n\n` +
                `Terdapat peminjaman yang *MELEWATI BATAS TEMPO* selama *${overdueDays} hari*.\n\n` +
                `👤 Peminjam: *${loan.borrower_name}*\n` +
                `🏫 Kelas: ${loan.borrower_class || '-'}\n` +
                `📦 Barang: ${loan.item_name} (${loan.item_code})\n` +
                `📅 Jatuh Tempo: ${formattedDate}\n` +
                `📞 Kontak: ${loan.borrower_contact || 'Tidak tersedia'}\n\n` +
                `_Harap segera hubungi peminjam._\n` +
                `_Notifikasi dari AMS-SMK_`;
        } else {
            message = `🔔 *PENGINGAT PEMINJAMAN*\n\n` +
                `Terdapat peminjaman yang belum dikembalikan.\n\n` +
                `👤 Peminjam: *${loan.borrower_name}*\n` +
                `🏫 Kelas: ${loan.borrower_class || '-'}\n` +
                `📦 Barang: ${loan.item_name} (${loan.item_code})\n` +
                `📅 Harus Kembali: ${formattedDate}\n` +
                `📞 Kontak: ${loan.borrower_contact || 'Tidak tersedia'}\n\n` +
                `_Notifikasi dari AMS-SMK_`;
        }

        const waResponse = await sendWhatsApp(adminWa, message);
        
        if (waResponse.status) {
            res.json({ success: true, message: 'WhatsApp alert sent to admin!' });
        } else {
            res.status(500).json({ error: 'Fonnte failed to send message', details: waResponse });
        }
    } catch (error) {
        console.error('Remind loan error:', error);
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
            WHERE l.status = 'borrowed' AND l.due_date <= CURRENT_DATE
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
    getOverdueLoans,
    remindLoan
};
