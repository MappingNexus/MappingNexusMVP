import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import PublicLayout from '../shared/PublicLayout';

interface Props {
    onLogin: (email: string, password: string, companySecret: string) => Promise<{ success: boolean; message?: string }>;
    onGoogleLogin: (idToken: string, companySecret: string) => Promise<{ success: boolean; message?: string }>;
}

const LoginPage: React.FC<Props> = ({ onLogin, onGoogleLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companySecret, setCompanySecret] = useState('');
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
            const result = await onLogin(email, password, '');
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
                const result = await onGoogleLogin(credentialResponse.credential, '');
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
        <PublicLayout>
            <main className="w-full max-w-lg mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
                
                {/* Title */}
                <div className="text-center mb-10 w-full z-20">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111] dark:text-white tracking-tight mb-4">
                        Welcome Back.
                    </h1>
                    <p className="text-[#666666] dark:text-[#a0a0a0] text-lg font-light">
                        Log in to your Mapping Nexus enterprise account.
                    </p>
                </div>

                {/* Glass Card */}
                <div className="w-full bg-white/70 dark:bg-[#111111]/70 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-8 sm:p-10 z-10 transition-transform hover:-translate-y-1 duration-500">
                    
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
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or sign in with email</span>
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Work Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                placeholder="you@company.com"
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all pr-12"
                                    placeholder="••••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center px-6 py-4 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10 dark:shadow-white/10 group"
                            >
                                {loading ? 'Authenticating...' : 'Sign In'}
                                {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />}
                            </button>
                        </div>
                    </form>
                    
                    {/* Footers */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Link to="/forgot-password" className="text-sm font-semibold text-[#666666] hover:text-[#111] dark:hover:text-white transition-colors">
                            Forgot Password?
                        </Link>
                        <Link to="/onboard" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                            New Company? Onboard
                        </Link>
                    </div>
                </div>
            </main>
        </PublicLayout>
    );
};

export default LoginPage;
