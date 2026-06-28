const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const loansRoutes = require('./routes/loans');
const consumablesRoutes = require('./routes/consumables');
const consumableUsesRoutes = require('./routes/consumableUses');
const cannibalizationRoutes = require('./routes/cannibalization');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const ocrRoutes = require('./routes/ocr');
const stockAuditRoutes = require('./routes/stockAudits');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/consumables', consumablesRoutes);
app.use('/api/consumable-uses', consumableUsesRoutes);
app.use('/api/cannibalization', cannibalizationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/stock-audits', stockAuditRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'AMS-SMK API is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AMS-SMK Server running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
