const supabase = require('../config/supabaseClient');
const menuDoctorService = require('../services/menuDoctorService');

exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Map user to restaurant_id
        const { data: restaurant, error: resErr } = await supabase
            .from('restaurants')
            .select('id')
            .eq('userId', userId)
            .single();

        if (resErr || !restaurant) {
            return res.status(404).json({ error: 'Restaurant not found for this user.' });
        }

        const restaurant_id = restaurant.id;

        // Ask the doctor service for analytics
        const recommendations = await menuDoctorService.generateRecommendations(restaurant_id);

        return res.status(200).json(recommendations);

    } catch (error) {
        console.error('Menu Doctor Controller Error:', error);
        res.status(500).json({ error: 'Internal server error generating menu insights.' });
    }
};
