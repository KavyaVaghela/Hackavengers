const express = require('express');

const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurant');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Note: Keeping existing auth/restaurant routes as they are, adding menu
app.use('/auth', authRoutes);
app.use('/restaurant', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
    res.send('PetPooja API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
