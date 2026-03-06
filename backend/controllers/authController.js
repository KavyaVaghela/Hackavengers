const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

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

        // Check if user exists in Supabase
        let { data: user, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('googleId', googleId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            console.error('Supabase select error:', selectError);
            return res.status(500).json({ error: 'Database error fetching user' });
        }

        // Create user if not exists
        if (!user) {
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{ googleId, email, name }])
                .select()
                .single();

            if (insertError) {
                console.error('Supabase insert error:', insertError);
                return res.status(500).json({ error: 'Database error creating user' });
            }
            user = newUser;
        }

        // Generate internal JWT token
        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token: jwtToken,
            user: {
                id: user.id,
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
