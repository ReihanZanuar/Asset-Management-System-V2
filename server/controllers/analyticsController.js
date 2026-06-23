const { query } = require('../config/database');

// Get dashboard metrics
const getDashboardMetrics = async (req, res) => {
    try {
        // Get all metrics in parallel
        const [inventoryStats, loanStats, consumableStats, recentActivity] = await Promise.all([
            // Inventory stats
            query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN condition = 'available' THEN 1 END) as available,
                    COUNT(CASE WHEN condition = 'borrowed' THEN 1 END) as borrowed,
                    COUNT(CASE WHEN condition = 'maintenance' THEN 1 END) as maintenance,
                    COUNT(CASE WHEN condition = 'damaged' THEN 1 END) as damaged
                FROM inventory
            `),
            // Loan stats
            query(`
                SELECT 
                    COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as active,
                    COUNT(CASE WHEN status = 'borrowed' AND due_date < CURRENT_DATE THEN 1 END) as overdue
                FROM loans
            `),
            // Low stock consumables
            query(`
                SELECT COUNT(*) as low_stock_count
                FROM consumables
                WHERE quantity <= min_threshold
            `),
            // Recent activity (last 10)
            query(`
                SELECT al.*, u.full_name as user_name
                FROM activity_logs al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC
                LIMIT 10
            `)
        ]);

        res.json({
            inventory: inventoryStats.rows[0],
            loans: loanStats.rows[0],
            consumables: {
                low_stock_count: consumableStats.rows[0].low_stock_count
            },
            recent_activity: recentActivity.rows
        });
    } catch (error) {
        console.error('Get dashboard metrics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get analytics reports
const getAnalyticsReports = async (req, res) => {
    try {
        const { period = '30' } = req.query; // days

        const [categoryDistribution, loanTrends, topBorrowed] = await Promise.all([
            // Inventory by category
            query(`
                SELECT category, COUNT(*) as count
                FROM inventory
                GROUP BY category
                ORDER BY count DESC
            `),
            // Loan trends
            query(`
                SELECT 
                    DATE(loan_date) as date,
                    COUNT(*) as loan_count
                FROM loans
                WHERE loan_date >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
                GROUP BY DATE(loan_date)
                ORDER BY date DESC
            `),
            // Most borrowed items
            query(`
                SELECT i.name, i.code, COUNT(l.id) as borrow_count
                FROM loans l
                JOIN inventory i ON l.inventory_id = i.id
                WHERE l.loan_date >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
                GROUP BY i.id, i.name, i.code
                ORDER BY borrow_count DESC
                LIMIT 10
            `)
        ]);

        res.json({
            category_distribution: categoryDistribution.rows,
            loan_trends: loanTrends.rows,
            top_borrowed: topBorrowed.rows
        });
    } catch (error) {
        console.error('Get analytics reports error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getDashboardMetrics,
    getAnalyticsReports
};
