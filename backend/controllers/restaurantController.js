const supabase = require('../config/supabaseClient');

exports.registerRestaurant = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { restaurantName, ownerName, gstNumber, email, phone, address } = req.body;

        // Check if user already registered a restaurant
        const { data: existingRestaurant, error: selectError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('userId', userId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            return res.status(500).json({ error: 'Database error checking restaurant' });
        }

        if (existingRestaurant) {
            return res.status(400).json({ error: 'User already has a registered restaurant' });
        }

        // Insert new restaurant
        const { data: newRestaurant, error: insertError } = await supabase
            .from('restaurants')
            .insert([{
                userId,
                restaurantName,
                ownerName,
                gstNumber,
                email,
                phone,
                address
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Restaurant insert error:', insertError);
            return res.status(500).json({ error: 'Database error registering restaurant' });
        }

        res.status(201).json({ message: 'Restaurant registered successfully', restaurant: newRestaurant });
    } catch (error) {
        console.error('Restaurant registration error:', error);
        res.status(500).json({ error: 'Internal server error while registering restaurant' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { data: restaurant, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('userId', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Restaurant not found for this user' });
        } else if (error) {
            console.error('Get restaurant error:', error);
            return res.status(500).json({ error: 'Database error fetching restaurant' });
        }

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found for this user' });
        }

        res.status(200).json({ restaurant });
    } catch (error) {
        console.error('Get restaurant error:', error);
        res.status(500).json({ error: 'Internal server error while fetching restaurant info' });
    }
};
