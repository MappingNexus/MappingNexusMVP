import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import PublicLayout from '../shared/PublicLayout';

interface Props {
    onLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    onGoogleLogin: (idToken: string) => Promise<{ success: boolean; message?: string }>;
}

const LoginPage: React.FC<Props> = ({ onLogin, onGoogleLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await onLogin(email, password);
            if (!result.success) setError(result.message || 'Invalid credentials.');
        } catch {
            setError('Connection failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;

        setLoading(true);
        setError('');
        try {
            const result = await onGoogleLogin(credentialResponse.credential);
            if (!result.success) setError(result.message || 'Google sign-in failed.');
        } catch {
            setError('Connection failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PublicLayout hideHeader>
            <main className="cb-container pt-16 pb-24">
                <div className="max-w-xl mx-auto">
                    <div className="mb-6 text-center">
                        {/* <div className="cb-caption mb-4">SIGN IN</div> */}
                        
                        <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-tight ">
                            Welcome back.
                        </h1>
                        <p className="mt-3 cb-body text-base sm:text-lg leading-relaxed">
                            Sign in to your Mapping Nexus workspace.
                        </p>
                    </div>

                    <div className="cb-card p-8 sm:p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google sign-in failed.')}
                                    useOneTap
                                    theme="outline"
                                    shape="pill"
                                    size="large"
                                />
                            </div>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm">or sign in with email</span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Work email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="cb-input"
                                    placeholder="you@company.com"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="cb-input pr-12"
                                        placeholder="••••••••••"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="pt-2">
                                <button type="submit" disabled={loading} className="cb-btn-primary w-full">
                                    {loading ? 'Authenticating…' : 'Sign in'}
                                    {!loading && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                            <Link to="/forgot-password" className="text-sm font-semibold cb-body hover:text-foreground transition-colors">
                                Forgot password?
                            </Link>
                            <Link to="/onboard" className="text-sm font-semibold text-primary hover:opacity-90 transition-opacity">
                                Create a workspace
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </PublicLayout>
    );
};

export default LoginPage;

