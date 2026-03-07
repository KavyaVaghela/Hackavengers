const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
const stream = require('stream');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.uploadCSV = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data: restaurant } = await supabase.from('restaurants').select('id').eq('userId', userId).single();
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found for this user.' });

        const restaurant_id = restaurant.id;
        const { menuType } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file uploaded' });
        }

        if (!menuType) {
            return res.status(400).json({ error: 'Menu type is required' });
        }

        const results = [];
        const requiredColumns = ['item_name', 'price', 'cost', 'margin', 'category'];
        let hasHeaderError = false;

        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        bufferStream
            .pipe(csv())
            .on('headers', (headers) => {
                const missingColumns = requiredColumns.filter(col => !headers.map(h => h.trim().toLowerCase()).includes(col));
                if (missingColumns.length > 0) {
                    hasHeaderError = true;
                }
            })
            .on('data', (data) => {
                if (hasHeaderError) return;

                // Normalize keys to lowercase due to potential CSV inconsistencies
                const normalizedData = {};
                for (const [key, value] of Object.entries(data)) {
                    normalizedData[key.trim().toLowerCase()] = value.trim();
                }

                // Validate specific data
                const item_name = normalizedData['item_name'];
                const price = parseFloat(normalizedData['price']);
                const cost = parseFloat(normalizedData['cost']);
                const margin = parseFloat(normalizedData['margin']);
                const category = normalizedData['category'];

                if (item_name && !isNaN(price) && !isNaN(cost) && !isNaN(margin) && category) {
                    results.push({
                        restaurant_id,
                        menu_type: menuType,
                        item_name,
                        price,
                        cost,
                        margin,
                        category
                    });
                }
            })
            .on('end', async () => {
                if (hasHeaderError) {
                    return res.status(400).json({
                        error: 'Invalid CSV format. Required columns: item_name, price, cost, margin, category'
                    });
                }

                if (results.length === 0) {
                    return res.status(400).json({ error: 'No valid data rows found in the CSV.' });
                }

                // Insert into Supabase
                const { data, error } = await supabase
                    .from('menus')
                    .insert(results);

                if (error) {
                    console.error('Supabase Insert Error:', error);
                    return res.status(500).json({ error: 'Failed to insert menu items into database.' });
                }

                return res.status(200).json({
                    message: 'Menu uploaded successfully!',
                    insertedCount: results.length
                });
            });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Internal server error during upload.' });
    }
};

exports.searchMenu = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data: restaurant } = await supabase.from('restaurants').select('id').eq('userId', userId).single();
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found for this user.' });

        const restaurant_id = restaurant.id;
        const { q } = req.query; // optional search query

        let query = supabase
            .from('menus')
            .select('*')
            .eq('restaurant_id', restaurant_id);

        if (q && q.trim() !== '') {
            query = query.ilike('item_name', `%${q}%`);
        }

        // Return latest items first
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Menu Search Error:', error);
            return res.status(500).json({ error: 'Failed to search menu.' });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Menu Search Error:', error);
        res.status(500).json({ error: 'Internal server error during search.' });
    }
};

// GET /api/menu — fetch all menu items for the authenticated restaurant
exports.getMenu = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('id')
            .eq('userId', userId)
            .single();

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found for this user.' });
        }

        const { data, error } = await supabase
            .from('menus')
            .select('id, item_name, price, category, menu_type')
            .eq('restaurant_id', restaurant.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get Menu Error:', error);
            return res.status(500).json({ error: 'Failed to fetch menu items.' });
        }

        return res.status(200).json(data || []);
    } catch (error) {
        console.error('Get Menu Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

