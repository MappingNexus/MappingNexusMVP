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
                    <div className="w-full bg-card/70 backdrop-blur-2xl rounded-3xl border border-border/60 shadow-2xl p-10 text-center relative z-10 transition-transform">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-success" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                            {isResetMode ? 'Password Reset Complete' : 'Password Updated'}
                        </h3>
                        <p className="text-muted-foreground mb-8">
                            {isResetMode ? 'Your password has been reset. Redirecting to sign in...' : 'Redirecting to your dashboard...'}
                        </p>
                        <Link to="/login" className="w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/10 group">
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Go to Sign In
                        </Link>
                    </div>
                </main>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <main className="w-full max-w-lg mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
                
                <div className="text-center mb-10 w-full z-20">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
                        {isResetMode ? 'Set New Password.' : 'Update Password.'}
                    </h1>
                    <p className="text-muted-foreground text-lg font-light">
                        {isResetMode ? 'Enter your new password below.' : 'Secure your enterprise account credentials.'}
                    </p>
                </div>

                <div className="w-full bg-card/70 backdrop-blur-2xl rounded-3xl border border-border/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-8 sm:p-10 z-10 transition-transform hover:-translate-y-1 duration-500">
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isResetMode && (
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Current Password</label>
                                <input 
                                    type="password" 
                                    value={currentPw} 
                                    onChange={e => setCurrentPw(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                    placeholder="••••••••••" 
                                />
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">New Password</label>
                            <input 
                                type="password" 
                                value={newPw} 
                                onChange={e => setNewPw(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                placeholder="Min 8 characters" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPw} 
                                onChange={e => setConfirmPw(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                placeholder="••••••••••" 
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10 dark:shadow-white/10 group"
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
                        <div className="mt-8 pt-6 border-t border-border/50 text-center">
                            {isResetMode ? (
                                <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
                                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Login
                                </Link>
                            ) : (
                                <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
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
