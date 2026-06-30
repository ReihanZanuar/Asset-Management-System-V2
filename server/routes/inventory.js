const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upload, processUploadedImages } = require('../middleware/upload');
const {
    getAllInventory,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory,
    getInventoryStats,
    generateQRCode,
    getNextCode
} = require('../controllers/inventoryController');

// Public routes (require authentication)
router.use(authenticateToken);

// GET /api/inventory - Get all inventory items with filters
router.get('/', getAllInventory);

// GET /api/inventory/stats - Get inventory statistics
router.get('/stats', getInventoryStats);

// GET /api/inventory/next-code - Generate next available code
router.get('/next-code', getNextCode);

// GET /api/inventory/:id - Get single inventory item
router.get('/:id', getInventoryById);

// GET /api/inventory/:id/qrcode - Generate QR code for inventory item
router.get('/:id/qrcode', generateQRCode);

// POST /api/inventory - Create new inventory item with up to 5 images
router.post('/', upload.array('images', 5), processUploadedImages, createInventory);

// PUT /api/inventory/:id - Update inventory item with optional new images
router.put('/:id', upload.array('images', 5), processUploadedImages, updateInventory);

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', deleteInventory);

module.exports = router;
