const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // Find or create user
        let user = await User.findOne({ googleId });
        if (!user) {
            user = new User({
                googleId,
                email,
                name,
            });
            await user.save();
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                googleId: user.googleId,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ error: 'Invalid Google token' });
    }
};
