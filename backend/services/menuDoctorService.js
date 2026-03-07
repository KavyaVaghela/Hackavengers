const supabase = require('../config/supabaseClient');

// Helper to determine the current season/festival based on the month
const getFestivalSuggestion = () => {
    const month = new Date().getMonth(); // 0-11

    if (month >= 9 && month <= 10) { // Oct/Nov
        return { season: 'Diwali', name: 'Diwali Dhamaka Combo' };
    } else if (month === 11) { // Dec
        return { season: 'Christmas/New Year', name: 'Festive Feast Combo' };
    } else if (month === 2) { // March
        return { season: 'Holi', name: 'Holi Special Thali' };
    } else if (month >= 3 && month <= 5) { // Apr/May/Jun
        return { season: 'Summer', name: 'Summer Cooler Combo' };
    } else if (month >= 6 && month <= 8) { // Jul/Aug/Sep
        return { season: 'Monsoon', name: 'Monsoon Munchies' };
    } else {
        return { season: 'Special Event', name: 'Chef\'s Special Combo' };
    }
};

exports.generateRecommendations = async (restaurant_id) => {
    try {
        // STEP 1: Fetch all menu items
        const { data: menuData, error: menuErr } = await supabase
            .from('menus')
            .select('*')
            .eq('restaurant_id', restaurant_id);

        if (menuErr) throw new Error('Failed to fetch menus');

        // STEP 2: Fetch all order items and calculate total demand per item
        // Note: Joining across tables securely in backend JS logic rather than raw SQL 
        // to simplify RLS policies and multi-tenant handling.

        const { data: orderData, error: orderErr } = await supabase
            .from('orders')
            .select('id')
            .eq('restaurant_id', restaurant_id);

        if (orderErr) throw new Error('Failed to fetch orders');

        const orderIds = orderData.map(o => o.id);

        let orderItems = [];
        if (orderIds.length > 0) {
            const { data: itemsData, error: itemsErr } = await supabase
                .from('order_items')
                .select('menu_id, quantity')
                .in('order_id', orderIds);

            if (itemsErr) throw new Error('Failed to fetch order items');
            orderItems = itemsData;
        }

        // Map demands
        const demandMap = {};
        orderItems.forEach(item => {
            if (item.menu_id) {
                if (!demandMap[item.menu_id]) demandMap[item.menu_id] = 0;
                demandMap[item.menu_id] += item.quantity;
            }
        });

        // Enrich menu items with derived analytical stats
        const analyzedItems = menuData.map(item => {
            const marginAmount = parseFloat(item.margin);
            const marginPercentage = (marginAmount / parseFloat(item.price)) * 100;
            const totalSold = demandMap[item.id] || 0;
            return {
                ...item,
                marginPercentage,
                totalSold
            };
        });

        // Calculate statistical averages to define "High/Low" thresholds dynamically
        const totalItemsCount = analyzedItems.length;
        if (totalItemsCount === 0) return { priceSuggestions: [], offers: [], menuSuggestions: [] };

        const avgMarginPct = analyzedItems.reduce((acc, curr) => acc + curr.marginPercentage, 0) / totalItemsCount;
        const avgDemand = analyzedItems.reduce((acc, curr) => acc + curr.totalSold, 0) / totalItemsCount;

        const priceSuggestions = [];
        const menuSuggestions = [];
        const offers = [];

        // Engines rules
        analyzedItems.forEach(item => {
            const isHighDemand = item.totalSold > avgDemand;
            const isLowMargin = item.marginPercentage < avgMarginPct;

            // STEP 3: PRICE OPTIMIZATION ENGINE
            if (isHighDemand && isLowMargin) {
                priceSuggestions.push({
                    type: 'increase',
                    itemName: item.item_name,
                    suggestion: `Increase price by ₹${Math.ceil((item.price * 0.1) / 10) * 10}`, // Suggest 10% increase rounded to 10s
                    reason: `Item demand is high (${item.totalSold} sold) but margin (${item.marginPercentage.toFixed(1)}%) is below average.`,
                    flow: ['Order Data', 'Demand Analysis (High)', 'Margin Analysis (Low)', 'Increase Price']
                });
            } else if (!isHighDemand && !isLowMargin && item.totalSold > 0) {
                priceSuggestions.push({
                    type: 'promotion',
                    itemName: item.item_name,
                    suggestion: `Run a ₹${Math.floor(item.margin * 0.2)} discount promotion`,
                    reason: `Margin is high (${item.marginPercentage.toFixed(1)}%) but demand is low (${item.totalSold} sold). A slight discount can boost sales volume.`,
                    flow: ['Order Data', 'Demand Analysis (Low)', 'Margin Analysis (High)', 'Discount Promotion']
                });
            }

            // STEP 4: MENU IMPROVEMENT ENGINE
            if (item.totalSold === 0 && item.marginPercentage < avgMarginPct) {
                menuSuggestions.push({
                    type: 'remove',
                    itemName: item.item_name,
                    suggestion: 'Consider removing or bundling this item',
                    reason: 'Zero demand and bad margins. Takes up prep time for no return.',
                    flow: ['Order Data', 'Demand Analysis (Zero)', 'Margin Analysis (Poor)', 'Remove or Bundle']
                });
            } else if (isHighDemand && !isLowMargin) {
                menuSuggestions.push({
                    type: 'star',
                    itemName: item.item_name,
                    suggestion: 'Highlight as a "Chef\'s Special"',
                    reason: `This is your star item. High demand (${item.totalSold} sold) and excellent margin!`,
                    flow: ['Order Data', 'Demand Analysis (High)', 'Margin Analysis (High)', 'Promote as Star']
                });
            }
        });

        // STEP 5: FESTIVAL OFFER RECOMMENDATION ENGINE
        const festival = getFestivalSuggestion();

        // Find top high-margin logic for combos
        const highMarginItems = analyzedItems.filter(i => i.marginPercentage >= avgMarginPct).sort((a, b) => b.totalSold - a.totalSold);

        if (highMarginItems.length >= 2) {
            const mainDish = highMarginItems.find(i => (i.category || '').toLowerCase().includes('main') || (i.category || '').toLowerCase().includes('rice')) || highMarginItems[0];
            const sideDish = highMarginItems.find(i => i.id !== mainDish.id && ((i.category || '').toLowerCase().includes('bread') || (i.category || '').toLowerCase().includes('dessert') || (i.category || '').toLowerCase().includes('beverage'))) || highMarginItems[1];

            if (mainDish && sideDish) {
                offers.push({
                    type: 'seasonal',
                    offerName: festival.name,
                    items: [mainDish.item_name, sideDish.item_name],
                    suggestion: `Bundle these for a 10% overall discount`,
                    reason: `High margin popular items during the ${festival.season} season. Groups love combos!`,
                    flow: ['Season Detection', 'High Margin Filter', 'Category Matching', 'Combo Created']
                });
            }
        }

        return {
            priceSuggestions: priceSuggestions.slice(0, 5), // top 5
            menuSuggestions: menuSuggestions.slice(0, 5), // top 5
            offers
        };

    } catch (error) {
        console.error('Menu Doctor Service Error:', error);
        throw error;
    }
};
