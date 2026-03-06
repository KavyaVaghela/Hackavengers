'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function Providers({ children }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy_client_id';

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
