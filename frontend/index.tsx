import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const isGoogleAuthConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'placeholder-client-id';

const app = (
    <App />
);

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <ErrorBoundary fallbackMessage="The Mapping Nexus application encountered an error. Please try again.">
            {isGoogleAuthConfigured ? (
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    {app}
                </GoogleOAuthProvider>
            ) : app}
        </ErrorBoundary>
    </React.StrictMode>
);
