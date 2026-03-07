const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for memory storage (we just need to parse the buffer)
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authMiddleware, menuController.getMenu);
router.post('/upload', authMiddleware, upload.single('csvFile'), menuController.uploadCSV);
router.get('/search', authMiddleware, menuController.searchMenu);

module.exports = router;
