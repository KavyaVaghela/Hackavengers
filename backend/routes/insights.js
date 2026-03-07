const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/revenue-daily', authMiddleware, insightsController.getDailyRevenue);
router.get('/revenue-monthly', authMiddleware, insightsController.getMonthlyRevenue);
router.get('/top-items', authMiddleware, insightsController.getTopItems);
router.get('/menu-classification', authMiddleware, insightsController.getMenuClassification);
router.get('/combo-recommendations', authMiddleware, insightsController.getComboRecommendations);
router.get('/sales-forecast', authMiddleware, insightsController.getSalesForecast);

module.exports = router;
