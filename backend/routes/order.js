const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/manual', authMiddleware, orderController.createManualOrder);
router.post('/voice', authMiddleware, orderController.createVoiceOrder);
router.get('/:id', authMiddleware, orderController.getOrder);
router.post('/bill/generate', authMiddleware, orderController.generateBillPDF);

module.exports = router;
