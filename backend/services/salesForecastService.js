const supabase = require('../config/supabaseClient');

exports.getSalesForecast = async (restaurant_id) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('created_at, total_amount')
            .eq('restaurant_id', restaurant_id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Ensure there is enough data
        if (!orders || orders.length === 0) {
            return {
                predictedRevenue: 0,
                peakHour: 'N/A',
                expectedTopItem: 'N/A',
                trendData: [],
                flow: ['Historical Orders Checked', 'Insufficient Data', 'Forecast Halted']
            };
        }

        // 1. REVENUE FORECAST (Moving Average)
        const dailyMap = {};
        orders.forEach(order => {
            const day = new Date(order.created_at).toISOString().split('T')[0];
            if (!dailyMap[day]) dailyMap[day] = 0;
            dailyMap[day] += parseFloat(order.total_amount);
        });

        const dailyRevenues = Object.values(dailyMap);
        let predictedRevenue = 0;

        // Simple 7-day moving average (or less if fewer days exist)
        const windowSize = Math.min(7, dailyRevenues.length);
        if (windowSize > 0) {
            const recentDays = dailyRevenues.slice(-windowSize);
            const sum = recentDays.reduce((a, b) => a + b, 0);
            predictedRevenue = Math.round(sum / windowSize);
        }

        // Format trend data for the frontend chart (Last X days + Tomorrow)
        const trendData = Object.keys(dailyMap).slice(-7).map(day => ({
            name: day,
            actual: dailyMap[day],
            predicted: null // Actual history doesn't have prediction overlay for this simplified model
        }));

        // Add tomorrow's prediction point
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + 1);
        const tomorrowStr = dateObj.toISOString().split('T')[0];

        trendData.push({
            name: 'Tomorrow',
            actual: null,
            predicted: predictedRevenue
        });

        // 2. PEAK HOUR PREDICTION
        const hourCounts = {};
        orders.forEach(order => {
            const hour = new Date(order.created_at).getHours(); // 0-23
            if (!hourCounts[hour]) hourCounts[hour] = 0;
            hourCounts[hour]++;
        });

        let peakHourVal = -1;
        let maxCount = -1;
        Object.keys(hourCounts).forEach(h => {
            if (hourCounts[h] > maxCount) {
                maxCount = hourCounts[h];
                peakHourVal = parseInt(h);
            }
        });

        let peakHourStr = 'N/A';
        if (peakHourVal !== -1) {
            const endHour = (peakHourVal + 2) % 24;
            const formatHour = (h) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
            peakHourStr = `${formatHour(peakHourVal)} - ${formatHour(endHour)}`;
        }

        // 3. EXPECTED TOP ITEM PREDICTION
        // Fetch all order items from the last 7 days to predict tomorrow
        const last7DaysDate = new Date();
        last7DaysDate.setDate(last7DaysDate.getDate() - 7);

        const recentOrderIds = orders
            .filter(o => new Date(o.created_at) >= last7DaysDate)
            .map(o => o.id);

        let expectedTopItem = 'N/A';

        if (recentOrderIds.length > 0) {
            const { data: recentItems, error: itemsErr } = await supabase
                .from('order_items')
                .select('item_name, quantity')
                .in('order_id', recentOrderIds);

            if (!itemsErr && recentItems) {
                const itemCounts = {};
                recentItems.forEach(item => {
                    if (!itemCounts[item.item_name]) itemCounts[item.item_name] = 0;
                    itemCounts[item.item_name] += item.quantity;
                });

                let maxItemCount = -1;
                Object.keys(itemCounts).forEach(item => {
                    if (itemCounts[item] > maxItemCount) {
                        maxItemCount = itemCounts[item];
                        expectedTopItem = item;
                    }
                });
            }
        }

        return {
            predictedRevenue,
            peakHour: peakHourStr,
            expectedTopItem,
            trendData,
            flow: [
                'Historical Orders Loaded',
                'Revenue Trend Detection',
                'Time Pattern Analysis',
                'Moving Average Model',
                'Future Revenue Prediction'
            ]
        };

    } catch (error) {
        console.error('Forecast Service Error:', error);
        throw error;
    }
};
