const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { scanImage } = require('../controllers/ocrController');

// All OCR endpoints require auth
router.use(authenticateToken);

// POST /api/ocr/scan - Extract items from uploaded image using Gemini API
router.post('/scan', upload.single('image'), scanImage);

module.exports = router;
