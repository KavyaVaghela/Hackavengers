const express = require('express');
const router = express.Router();
const upsellController = require('../controllers/upsellController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, upsellController.getUpsells);

module.exports = router;
