const supabase = require('../config/supabaseClient');

exports.getUpsells = async (req, res) => {
    try {
        // Attempt to fetch upsell rules
        const { data, error } = await supabase.from('upsell_rules').select('*');

        if (error) {
            // Fallback rules if the table isn't created yet or error occurs
            console.log("Upsell table might not exist yet, returning defaults. Error:", error.message);
            return res.status(200).json([
                { trigger_item: 'Burger', suggest_item: 'Fries' },
                { trigger_item: 'Pizza', suggest_item: 'Garlic Bread' },
                { trigger_item: 'Coffee', suggest_item: 'Cookie' }
            ]);
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching upsells:', err);
        res.status(500).json({ error: 'Failed to fetch upsell rules' });
    }
};
