const express = require('express');
const router = express.Router();
const upsellController = require('../controllers/upsellController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, upsellController.getUpsells);

module.exports = router;
