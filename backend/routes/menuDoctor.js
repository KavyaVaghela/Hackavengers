const express = require('express');
const router = express.Router();
const menuDoctorController = require('../controllers/menuDoctorController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/recommendations', authMiddleware, menuDoctorController.getRecommendations);

module.exports = router;
