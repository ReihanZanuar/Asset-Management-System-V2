const ExcelJS = require('exceljs');
const { query } = require('../config/database');

// Export Inventory to Excel
const exportInventory = async (req, res) => {
    try {
        const { category, condition, search } = req.query;
        
        // Build query with filters
        let sql = 'SELECT * FROM inventory WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (category) {
            sql += ` AND category = $${paramCount++}`;
            params.push(category);
        }

        if (condition) {
            sql += ` AND condition = $${paramCount++}`;
            params.push(condition);
        }

        if (search) {
            sql += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, params);
        const items = result.rows;

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventory');

        // Add title
        worksheet.mergeCells('A1:I1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Inventory Export';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };

        // Add export date and filters
        worksheet.mergeCells('A2:I2');
        const dateCell = worksheet.getCell('A2');
        let filterText = `Exported on: ${new Date().toLocaleString()}`;
        if (category || condition || search) {
            filterText += ' | Filters: ';
            const filters = [];
            if (category) filters.push(`Category: ${category}`);
            if (condition) filters.push(`Condition: ${condition}`);
            if (search) filters.push(`Search: ${search}`);
            filterText += filters.join(', ');
        }
        dateCell.value = filterText;
        dateCell.font = { size: 10, italic: true };
        dateCell.alignment = { horizontal: 'center' };

        // Add headers
        worksheet.getRow(4).values = [
            'Code',
            'Name',
            'Category',
            'Condition',
            'Location',
            'Purchase Date',
            'Price',
            'Specifications',
            'Notes'
        ];

        // Style headers
        worksheet.getRow(4).font = { bold: true };
        worksheet.getRow(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        worksheet.getRow(4).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        worksheet.getRow(4).alignment = { horizontal: 'center', vertical: 'middle' };

        // Add data
        items.forEach((item, index) => {
            const row = worksheet.getRow(5 + index);
            row.values = [
                item.code,
                item.name,
                item.category,
                item.condition,
                item.location,
                item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '',
                item.price ? `Rp ${Number(item.price).toLocaleString('id-ID')}` : '',
                item.specifications || '',
                item.notes || ''
            ];
        });

        // Auto-fit columns
        worksheet.columns = [
            { width: 15 },  // Code
            { width: 25 },  // Name
            { width: 15 },  // Category
            { width: 15 },  // Condition
            { width: 20 },  // Location
            { width: 15 },  // Purchase Date
            { width: 15 },  // Price
            { width: 30 },  // Specifications
            { width: 30 }   // Notes
        ];

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export inventory error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
};

// Export Loans to Excel
const exportLoans = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        
        // Build query with filters
        let sql = `
            SELECT l.*, i.name as item_name, i.code as item_code
            FROM loans l
            JOIN inventory i ON l.inventory_id = i.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (status) {
            sql += ` AND l.status = $${paramCount++}`;
            params.push(status);
        }

        if (startDate) {
            sql += ` AND l.borrowed_date >= $${paramCount++}`;
            params.push(startDate);
        }

        if (endDate) {
            sql += ` AND l.borrowed_date <= $${paramCount++}`;
            params.push(endDate);
        }

        sql += ' ORDER BY l.borrowed_date DESC';

        const result = await query(sql, params);
        const loans = result.rows;

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Loans');

        // Add title
        worksheet.mergeCells('A1:I1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Loan Transactions Export';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };

        // Add export date and filters
        worksheet.mergeCells('A2:I2');
        const dateCell = worksheet.getCell('A2');
        let filterText = `Exported on: ${new Date().toLocaleString()}`;
        if (status || startDate || endDate) {
            filterText += ' | Filters: ';
            const filters = [];
            if (status) filters.push(`Status: ${status}`);
            if (startDate) filters.push(`From: ${startDate}`);
            if (endDate) filters.push(`To: ${endDate}`);
            filterText += filters.join(', ');
        }
        dateCell.value = filterText;
        dateCell.font = { size: 10, italic: true };
        dateCell.alignment = { horizontal: 'center' };

        // Add headers
        worksheet.getRow(4).values = [
            'Item Code',
            'Item Name',
            'Borrower Name',
            'Borrower Contact',
            'Borrowed Date',
            'Due Date',
            'Returned Date',
            'Status',
            'Notes'
        ];

        // Style headers
        worksheet.getRow(4).font = { bold: true };
        worksheet.getRow(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };
        worksheet.getRow(4).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        worksheet.getRow(4).alignment = { horizontal: 'center', vertical: 'middle' };

        // Add data
        loans.forEach((loan, index) => {
            const row = worksheet.getRow(5 + index);
            row.values = [
                loan.item_code,
                loan.item_name,
                loan.borrower_name,
                loan.borrower_contact,
                new Date(loan.borrowed_date).toLocaleDateString(),
                new Date(loan.due_date).toLocaleDateString(),
                loan.returned_date ? new Date(loan.returned_date).toLocaleDateString() : '-',
                loan.status,
                loan.notes || ''
            ];
        });

        // Auto-fit columns
        worksheet.columns = [
            { width: 15 },  // Item Code
            { width: 25 },  // Item Name
            { width: 20 },  // Borrower Name
            { width: 18 },  // Borrower Contact
            { width: 15 },  // Borrowed Date
            { width: 15 },  // Due Date
            { width: 15 },  // Returned Date
            { width: 12 },  // Status
            { width: 30 }   // Notes
        ];

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=loans_export_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export loans error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
};

// Export Consumables to Excel
const exportConsumables = async (req, res) => {
    try {
        const { lowStock } = req.query;
        
        // Build query with filters
        let sql = 'SELECT * FROM consumables WHERE 1=1';
        
        if (lowStock === 'true') {
            sql += ' AND quantity <= low_stock_threshold';
        }

        sql += ' ORDER BY name';

        const result = await query(sql, []);
        const consumables = result.rows;

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Consumables');

        // Add title
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Consumables Export';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };

        // Add export date and filters
        worksheet.mergeCells('A2:G2');
        const dateCell = worksheet.getCell('A2');
        let filterText = `Exported on: ${new Date().toLocaleString()}`;
        if (lowStock === 'true') {
            filterText += ' | Showing: Low Stock Items Only';
        }
        dateCell.value = filterText;
        dateCell.font = { size: 10, italic: true };
        dateCell.alignment = { horizontal: 'center' };

        // Add headers
        worksheet.getRow(4).values = [
            'Name',
            'Quantity',
            'Unit',
            'Low Stock Threshold',
            'Status',
            'Location',
            'Notes'
        ];

        // Style headers
        worksheet.getRow(4).font = { bold: true };
        worksheet.getRow(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF59E0B' }
        };
        worksheet.getRow(4).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        worksheet.getRow(4).alignment = { horizontal: 'center', vertical: 'middle' };

        // Add data
        consumables.forEach((item, index) => {
            const row = worksheet.getRow(5 + index);
            const isLowStock = item.quantity <= item.low_stock_threshold;
            row.values = [
                item.name,
                item.quantity,
                item.unit,
                item.low_stock_threshold,
                isLowStock ? 'Low Stock' : 'In Stock',
                item.location || '',
                item.notes || ''
            ];

            // Highlight low stock rows
            if (isLowStock) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFEF3C7' }
                };
            }
        });

        // Auto-fit columns
        worksheet.columns = [
            { width: 25 },  // Name
            { width: 12 },  // Quantity
            { width: 10 },  // Unit
            { width: 18 },  // Threshold
            { width: 12 },  // Status
            { width: 20 },  // Location
            { width: 30 }   // Notes
        ];

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=consumables_export_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export consumables error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
};

module.exports = {
    exportInventory,
    exportLoans,
    exportConsumables
};
