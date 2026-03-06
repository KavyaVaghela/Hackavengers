const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authMiddleware, restaurantController.registerRestaurant);
router.get('/me', authMiddleware, restaurantController.getMe);

module.exports = router;
