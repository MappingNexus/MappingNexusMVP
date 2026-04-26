import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';
import PublicLayout from '../shared/PublicLayout';

const ChangePasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Extract token from URL query params (e.g. /change-password?token=abc123)
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const resetToken = searchParams.get('token');
    const isResetMode = !!resetToken;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
        if (newPw.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setLoading(true); 
        setError('');
        
        try {
            if (isResetMode) {
                // Reset mode — send token + new password to backend
                const result = await api.resetPassword(resetToken!, newPw);
                setLoading(false);

                if (result.success) {
                    setSuccess(true);
                    setTimeout(() => navigate('/login'), 2500);
                } else {
                    setError(result.message || 'Failed to reset password.');
                }
            } else {
                // Authenticated change mode — user is logged in and changing their own password
                const result = await api.changePassword(currentPw, newPw);
                setLoading(false);

                if (result.success) { 
                    setSuccess(true); 
                    setTimeout(() => navigate('/'), 2000); 
                } else {
                    setError(result.message || 'Failed to change password.');
                }
            }
        } catch {
            setLoading(false);
            setError('Connection failed. Is the backend running?');
        }
    };

    // ── Success State ──
    if (success) {
        return (
            <PublicLayout>
                <main className="w-full max-w-lg mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
                    <div className="w-full bg-white/70 dark:bg-[#111111]/70 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-white/10 shadow-2xl p-10 text-center relative z-10 transition-transform">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#111] dark:text-white mb-3">
                            {isResetMode ? 'Password Reset Complete' : 'Password Updated'}
                        </h3>
                        <p className="text-[#666666] dark:text-[#a0a0a0] mb-8">
                            {isResetMode ? 'Your password has been reset. Redirecting to sign in...' : 'Redirecting to your dashboard...'}
                        </p>
                        <Link to="/login" className="w-full flex items-center justify-center px-6 py-4 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/10 group">
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Go to Sign In
                        </Link>
                    </div>
                </main>
            </PublicLayout>
        );
    }

    // ── Invalid Token Guard (reset mode with no token) ──
    // This case shouldn't normally happen since isResetMode requires a token,
    // but we keep the error display for when backend returns token errors.

    return (
        <PublicLayout>
            <main className="w-full max-w-lg mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
                
                <div className="text-center mb-10 w-full z-20">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111] dark:text-white tracking-tight mb-4">
                        {isResetMode ? 'Set New Password.' : 'Update Password.'}
                    </h1>
                    <p className="text-[#666666] dark:text-[#a0a0a0] text-lg font-light">
                        {isResetMode ? 'Enter your new password below.' : 'Secure your enterprise account credentials.'}
                    </p>
                </div>

                <div className="w-full bg-white/70 dark:bg-[#111111]/70 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-8 sm:p-10 z-10 transition-transform hover:-translate-y-1 duration-500">
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isResetMode && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                                <input 
                                    type="password" 
                                    value={currentPw} 
                                    onChange={e => setCurrentPw(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                    placeholder="••••••••••" 
                                />
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                            <input 
                                type="password" 
                                value={newPw} 
                                onChange={e => setNewPw(e.target.value)}
                                className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                placeholder="Min 8 characters" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPw} 
                                onChange={e => setConfirmPw(e.target.value)}
                                className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                placeholder="••••••••••" 
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full flex items-center justify-center px-6 py-4 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10 dark:shadow-white/10 group"
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {isResetMode ? 'Resetting...' : 'Updating...'}</>
                                ) : (
                                    <>
                                        {isResetMode ? 'Set Password' : 'Update Password'}
                                        <ShieldCheck className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Footer links */}
                        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-white/10 text-center">
                            {isResetMode ? (
                                <Link to="/login" className="text-sm font-semibold text-[#666666] hover:text-[#111] dark:hover:text-white transition-colors flex items-center justify-center">
                                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Login
                                </Link>
                            ) : (
                                <Link to="/" className="text-sm font-semibold text-[#666666] hover:text-[#111] dark:hover:text-white transition-colors flex items-center justify-center">
                                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
                                </Link>
                            )}
                        </div>
                    </form>
                </div>
            </main>
        </PublicLayout>
    );
};

export default ChangePasswordPage;
