const supabase = require('../config/supabaseClient');
const analyticsService = require('../services/analyticsService');
const salesForecastService = require('../services/salesForecastService');

// Helper to securely map auth userId to restaurant_id
const getRestaurantId = async (req, res) => {
    const userId = req.user.userId;
    const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('userId', userId)
        .single();

    if (error || !restaurant) {
        res.status(404).json({ error: 'Restaurant not found for this user.' });
        return null;
    }
    return restaurant.id;
};

exports.getDailyRevenue = async (req, res) => {
    try {
        const id = await getRestaurantId(req, res);
        if (!id) return;
        const data = await analyticsService.getDailyRevenue(id);
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMonthlyRevenue = async (req, res) => {
    try {
        const id = await getRestaurantId(req, res);
        if (!id) return;
        const data = await analyticsService.getMonthlyRevenue(id);
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTopItems = async (req, res) => {
    try {
        const id = await getRestaurantId(req, res);
        if (!id) return;
        const data = await analyticsService.getTopItems(id);
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMenuClassification = async (req, res) => {
    try {
        const id = await getRestaurantId(req, res);
        if (!id) return;
        const data = await analyticsService.getMenuClassification(id);
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getComboRecommendations = async (req, res) => {
    try {
        const id = await getRestaurantId(req, res);
        if (!id) return;
        const data = await analyticsService.getComboRecommendations(id);
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSalesForecast = async (req, res) => {
    try {
        const id = await getRestaurantId(req, res);
        if (!id) return;
        const data = await salesForecastService.getSalesForecast(id);
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
