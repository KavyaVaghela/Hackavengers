const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantName: { type: String, required: true },
    ownerName: { type: String, required: true },
    gstNumber: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);
