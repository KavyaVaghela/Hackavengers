const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/authMiddleware');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/analytics/ai-orders
router.get('/ai-orders', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('id')
            .eq('userId', userId)
            .single();

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found.' });
        }

        const restaurant_id = restaurant.id;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch all ai_order records for this restaurant this month
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, total_amount, created_at')
            .eq('restaurant_id', restaurant_id)
            .eq('order_type', 'ai_order')
            .gte('created_at', monthStart);

        if (error) {
            console.error('Analytics Error:', error);
            return res.status(500).json({ error: 'Failed to fetch analytics.' });
        }

        const todayOrders = (orders || []).filter(o => o.created_at >= todayStart);
        const monthOrders = orders || [];

        return res.status(200).json({
            today: {
                count: todayOrders.length,
                revenue: todayOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
            },
            month: {
                count: monthOrders.length,
                revenue: monthOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
            }
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
