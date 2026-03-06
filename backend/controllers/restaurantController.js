const Restaurant = require('../models/Restaurant');

exports.registerRestaurant = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { restaurantName, ownerName, gstNumber, email, phone, address } = req.body;

        // Check if user already registered a restaurant
        let existingRestaurant = await Restaurant.findOne({ userId });
        if (existingRestaurant) {
            return res.status(400).json({ error: 'User already has a registered restaurant' });
        }

        const newRestaurant = new Restaurant({
            userId,
            restaurantName,
            ownerName,
            gstNumber,
            email,
            phone,
            address,
        });

        await newRestaurant.save();
        res.status(201).json({ message: 'Restaurant registered successfully', restaurant: newRestaurant });
    } catch (error) {
        console.error('Restaurant registration error:', error);
        res.status(500).json({ error: 'Internal server error while registering restaurant' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const restaurant = await Restaurant.findOne({ userId });

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found for this user' });
        }

        res.status(200).json({ restaurant });
    } catch (error) {
        console.error('Get restaurant error:', error);
        res.status(500).json({ error: 'Internal server error while fetching restaurant info' });
    }
};
