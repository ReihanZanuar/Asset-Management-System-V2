const { query } = require('../config/database');
const { deleteImages } = require('../middleware/upload');
const QRCode = require('qrcode');

// Get all inventory items
const getAllInventory = async (req, res) => {
    try {
        const { category, condition, search } = req.query;
        
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
            paramCount++;
        }

        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get single inventory item
const getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM inventory WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get inventory by ID error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create new inventory item
const createInventory = async (req, res) => {
    try {
        const { code, name, category, condition, location, purchase_date, price, specifications, notes } = req.body;
        
        // Build images array from uploaded files
        const images = req.files ? req.files.map(file => `/uploads/inventory/${file.filename}`) : [];

        const result = await query(
            `INSERT INTO inventory (code, name, category, condition, location, purchase_date, price, specifications, notes, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [code, name, category, condition || 'available', location, purchase_date, price, specifications, notes, images]
        );

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREATE', 'inventory', result.rows[0].id, `Created inventory item: ${name}`]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create inventory error:', error);
        
        // Clean up uploaded files if database insertion fails
        if (req.files) {
            const imagePaths = req.files.map(file => `/uploads/inventory/${file.filename}`);
            deleteImages(imagePaths);
        }
        
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Inventory code already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Update inventory item
const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, category, condition, location, purchase_date, price, specifications, notes, keepImages } = req.body;
        
        // Get existing item to access current images
        const existing = await query('SELECT images FROM inventory WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        let updatedImages = existing.rows[0].images || [];
        
        // Handle image updates
        if (req.files && req.files.length > 0) {
            // New images uploaded
            const newImages = req.files.map(file => `/uploads/inventory/${file.filename}`);
            
            // Parse keepImages (comma-separated string of image paths to keep)
            const imagesToKeep = keepImages ? keepImages.split(',').filter(Boolean) : [];
            
            // Delete old images that are not being kept
            const imagesToDelete = updatedImages.filter(img => !imagesToKeep.includes(img));
            if (imagesToDelete.length > 0) {
                deleteImages(imagesToDelete);
            }
            
            // Combine kept images with new images
            updatedImages = [...imagesToKeep, ...newImages];
        }

        const result = await query(
            `UPDATE inventory 
             SET code = $1, name = $2, category = $3, condition = $4, location = $5, 
                 purchase_date = $6, price = $7, specifications = $8, notes = $9, images = $10
             WHERE id = $11 RETURNING *`,
            [code, name, category, condition, location, purchase_date, price, specifications, notes, updatedImages, id]
        );

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'UPDATE', 'inventory', id, `Updated inventory item: ${name}`]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update inventory error:', error);
        
        // Clean up newly uploaded files if update fails
        if (req.files) {
            const imagePaths = req.files.map(file => `/uploads/inventory/${file.filename}`);
            deleteImages(imagePaths);
        }
        
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete inventory item
const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get item with images before deletion
        const item = await query('SELECT name, images FROM inventory WHERE id = $1', [id]);
        
        if (item.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const { name, images } = item.rows[0];

        // Delete the inventory item from database
        await query('DELETE FROM inventory WHERE id = $1', [id]);
        
        // Delete associated image files
        if (images && images.length > 0) {
            deleteImages(images);
        }

        // Log activity
        await query(
            'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'DELETE', 'inventory', id, `Deleted inventory item: ${name}`]
        );

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete inventory error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
    try {
        const stats = await query(`
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN condition = 'available' THEN 1 END) as available,
                COUNT(CASE WHEN condition = 'borrowed' THEN 1 END) as borrowed,
                COUNT(CASE WHEN condition = 'maintenance' THEN 1 END) as maintenance,
                COUNT(CASE WHEN condition = 'damaged' THEN 1 END) as damaged
            FROM inventory
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Get inventory stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Generate QR code for inventory item with comprehensive data
const generateQRCode = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM inventory WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = result.rows[0];

        // Create comprehensive data object to encode in QR code
        const qrData = {
            id: item.id,
            code: item.code,
            name: item.name,
            category: item.category,
            location: item.location,
            condition: item.condition,
            purchase_date: item.purchase_date,
            specifications: item.specifications,
            notes: item.notes
        };

        // Generate QR code as data URL
        const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.json({
            success: true,
            qrCode: qrCodeUrl,
            itemData: qrData
        });
    } catch (error) {
        console.error('Generate QR code error:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
};

module.exports = {
    getAllInventory,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory,
    getInventoryStats,
    generateQRCode
};
