const supabase = require('../config/supabaseClient');

exports.getDailyRevenue = async (restaurant_id) => {
    // In PostgreSQL, DATE() or DATE_TRUNC can group by day. 
    // Since we're using Supabase JS client without custom RPCs for simplicity, we'll fetch orders and group in memory.
    // For a production app with millions of orders, an RPC (Stored Procedure) is heavily recommended.
    const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('restaurant_id', restaurant_id)
        .order('created_at', { ascending: true });

    if (error) throw error;

    const dailyMap = {};
    orders.forEach(order => {
        const day = new Date(order.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!dailyMap[day]) dailyMap[day] = 0;
        dailyMap[day] += parseFloat(order.total_amount);
    });

    // Format for Recharts: [{ date: '2023-10-01', revenue: 15400 }]
    return Object.keys(dailyMap).map(day => ({
        date: day,
        revenue: dailyMap[day]
    }));
};

exports.getMonthlyRevenue = async (restaurant_id) => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('restaurant_id', restaurant_id)
        .order('created_at', { ascending: true });

    if (error) throw error;

    const monthlyMap = {};
    orders.forEach(order => {
        const month = new Date(order.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyMap[month]) monthlyMap[month] = 0;
        monthlyMap[month] += parseFloat(order.total_amount);
    });

    return Object.keys(monthlyMap).map(month => ({
        month: month,
        revenue: monthlyMap[month]
    }));
};

exports.getTopItems = async (restaurant_id) => {
    const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurant_id);

    if (ordersErr) throw ordersErr;
    if (orders.length === 0) return [];

    const orderIds = orders.map(o => o.id);

    const { data: orderItems, error: itemsErr } = await supabase
        .from('order_items')
        .select('item_name, quantity')
        .in('order_id', orderIds);

    if (itemsErr) throw itemsErr;

    const itemsMap = {};
    orderItems.forEach(item => {
        if (!itemsMap[item.item_name]) itemsMap[item.item_name] = 0;
        itemsMap[item.item_name] += item.quantity;
    });

    const sortedItems = Object.keys(itemsMap)
        .map(name => ({ item_name: name, total_sold: itemsMap[name] }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 10);

    return sortedItems;
};

exports.getMenuClassification = async (restaurant_id) => {
    const { data: menus, error: menusErr } = await supabase
        .from('menus')
        .select('id, item_name, price, margin')
        .eq('restaurant_id', restaurant_id);

    if (menusErr) throw menusErr;

    const { data: orders, error: ordersErr } = await supabase.from('orders').select('id').eq('restaurant_id', restaurant_id);
    if (ordersErr) throw ordersErr;

    let orderItems = [];
    if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const { data, error: itemsErr } = await supabase.from('order_items').select('menu_id, quantity').in('order_id', orderIds);
        if (itemsErr) throw itemsErr;
        orderItems = data;
    }

    const demandMap = {};
    orderItems.forEach(item => {
        if (item.menu_id) {
            if (!demandMap[item.menu_id]) demandMap[item.menu_id] = 0;
            demandMap[item.menu_id] += item.quantity;
        }
    });

    const analyzedItems = menus.map(item => ({
        ...item,
        margin: parseFloat(item.margin),
        total_sold: demandMap[item.id] || 0
    }));

    if (analyzedItems.length === 0) return [];

    const avgSales = analyzedItems.reduce((acc, curr) => acc + curr.total_sold, 0) / analyzedItems.length;
    const avgMargin = analyzedItems.reduce((acc, curr) => acc + curr.margin, 0) / analyzedItems.length;

    const classificationCount = { Star: 0, Plowhorse: 0, Puzzle: 0, Dog: 0 };

    const detailedList = analyzedItems.map(item => {
        const isHighSales = item.total_sold >= avgSales;
        const isHighMargin = item.margin >= avgMargin;
        let category = 'Dog';
        if (isHighSales && isHighMargin) category = 'Star';
        else if (isHighSales && !isHighMargin) category = 'Plowhorse';
        else if (!isHighSales && isHighMargin) category = 'Puzzle';

        classificationCount[category]++;

        return {
            item_name: item.item_name,
            total_sold: item.total_sold,
            margin: item.margin,
            category
        };
    });

    return {
        summary: [
            { name: 'Stars', value: classificationCount.Star },
            { name: 'Plowhorses', value: classificationCount.Plowhorse },
            { name: 'Puzzles', value: classificationCount.Puzzle },
            { name: 'Dogs', value: classificationCount.Dog }
        ],
        detailedList: detailedList.sort((a, b) => b.total_sold - a.total_sold) // for table
    };
};

exports.getComboRecommendations = async (restaurant_id) => {
    const { data: orders, error: ordersErr } = await supabase.from('orders').select('id').eq('restaurant_id', restaurant_id);
    if (ordersErr) throw ordersErr;

    if (orders.length === 0) return [];

    const orderIds = orders.map(o => o.id);
    const { data: orderItems, error: itemsErr } = await supabase.from('order_items').select('order_id, item_name').in('order_id', orderIds);
    if (itemsErr) throw itemsErr;

    // Group items by order
    const itemsByOrder = {};
    orderItems.forEach(item => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item.item_name);
    });

    // Count pairs
    const pairCounts = {};
    Object.values(itemsByOrder).forEach(items => {
        // Only look at orders with multiple unique items
        const uniqueItems = [...new Set(items)];
        if (uniqueItems.length >= 2) {
            for (let i = 0; i < uniqueItems.length; i++) {
                for (let j = i + 1; j < uniqueItems.length; j++) {
                    const pair = [uniqueItems[i], uniqueItems[j]].sort().join(' + ');
                    if (!pairCounts[pair]) pairCounts[pair] = 0;
                    pairCounts[pair]++;
                }
            }
        }
    });

    const topPairs = Object.keys(pairCounts)
        .map(pair => ({ combo: pair, count: pairCounts[pair] }))
        .sort((a, b) => b.count - a.count)
        .filter(p => p.count >= 2) // minimum threshold to be considered frequent
        .slice(0, 3) // Top 3 combos
        .map(p => ({
            title: `${p.combo} Combo`,
            reason: `These items have been ordered together ${p.count} times. Consider offering them as a discounted bundle to increase order size.`
        }));

    return topPairs;
};
