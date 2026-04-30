import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowRight, Lock } from 'lucide-react';
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

        // Standard Flow
        if (!email || !password) { setError('Email and Password are required.'); return; }
        setLoading(true);
        setError('');
        try {
            const result = await onLogin(email, password);
            if (!result.success) {
                setError(result.message || 'Invalid credentials.');
            }
        } catch {
            setError('Connection failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            setLoading(true);
            setError('');
            try {
                const result = await onGoogleLogin(credentialResponse.credential);
                if (!result.success) {
                    setError(result.message || 'Google Login failed.');
                }
            } catch {
                setError('Connection failed.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <PublicLayout hideHeader>
            <main className="w-full max-w-lg mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
                
                {/* Title */}
                <div className="text-center mb-10 w-full z-20">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
                        Welcome Back.
                    </h1>
                    <p className="text-muted-foreground text-lg font-light">
                        Log in to your Mapping Nexus enterprise account.
                    </p>
                </div>

                {/* Glass Card */}
                <div className="w-full bg-card/70 backdrop-blur-2xl rounded-3xl border border-border/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-8 sm:p-10 z-10 transition-transform hover:-translate-y-1 duration-500">
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Google Sign In Button */}
                        <div className="flex justify-center mb-6">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Sign In failed.')}
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

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Work Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                placeholder="you@company.com"
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all pr-12"
                                    placeholder="••••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10 dark:shadow-white/10 group"
                            >
                                {loading ? 'Authenticating...' : 'Sign In'}
                                {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />}
                            </button>
                        </div>
                    </form>
                    
                    {/* Footers */}
                    <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Link to="/forgot-password" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Forgot Password?
                        </Link>
                        <Link to="/onboard" className="text-sm font-semibold text-info hover:text-info/80 transition-colors">
                            New Company? Onboard
                        </Link>
                    </div>
                </div>
            </main>
        </PublicLayout>
    );
};

export default LoginPage;
