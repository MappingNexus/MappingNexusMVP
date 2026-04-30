import React, { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../services/api';
import PublicLayout from '../shared/PublicLayout';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) { setError('Please enter your email.'); return; }
        setLoading(true); setError('');
        try {
            const res = await api.forgotPassword(email);
            if (res.success) { setSent(true); }
            else { setError(res.message || 'Failed to send reset email.'); }
        } catch {
            setError('Connection failed. Is the backend running?');
        }
        setLoading(false);
    };

    return (
        <PublicLayout hideHeader>
            <main className="w-full max-w-lg mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
                
                {/* Title */}
                <div className="text-center mb-10 w-full z-20">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
                        Reset Password.
                    </h1>
                    <p className="text-muted-foreground text-lg font-light">
                        We'll send a reset link to your registered email.
                    </p>
                </div>

                {/* Glass Card */}
                <div className="w-full bg-card/70 backdrop-blur-2xl rounded-3xl border border-border/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-8 sm:p-10 z-10 transition-transform hover:-translate-y-1 duration-500">
                    
                    {sent ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-success" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">Email Sent</h3>
                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                If an account exists for <span className="text-foreground font-semibold">{email}</span>, a secure reset link will be delivered shortly.
                            </p>
                            <Link to="/login" className="w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/10 group">
                                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                                Return to Sign In
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending...</>
                                    ) : (
                                        <>
                                            Send Reset Link
                                            <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {/* Footers */}
                            <div className="mt-8 pt-6 border-t border-border/50 text-center">
                                <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
                                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </PublicLayout>
    );
};

export default ForgotPasswordPage;
