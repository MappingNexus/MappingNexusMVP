import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
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

 const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
 const resetToken = searchParams.get('token');
 const isResetMode = !!resetToken;

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (newPw !== confirmPw) {
 setError('Passwords do not match.');
 return;
 }
 if (newPw.length < 8) {
 setError('Password must be at least 8 characters.');
 return;
 }

 setLoading(true);
 setError('');

 try {
 if (isResetMode) {
 const result = await api.resetPassword(resetToken!, newPw);
 if (result.success) {
 setSuccess(true);
 setTimeout(() => navigate('/login'), 2500);
 } else {
 setError(result.message || 'Failed to reset password.');
 }
 } else {
 const result = await api.changePassword(currentPw, newPw);
 if (result.success) {
 setSuccess(true);
 setTimeout(() => navigate('/'), 2000);
 } else {
 setError(result.message || 'Failed to change password.');
 }
 }
 } catch {
 setError('Connection failed. Is the backend running?');
 } finally {
 setLoading(false);
 }
 };

 return (
 <PublicLayout hideHeader>
 <main className="cb-container pt-16 pb-24">
 <div className="max-w-xl mx-auto">
 <div className="mb-10">
 <div className="cb-caption mb-4">{isResetMode ? 'PASSWORD RESET' : 'PASSWORD UPDATE'}</div>
 <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-tight">
 {success ? 'Password updated.' : isResetMode ? 'Set a new password.' : 'Update your password.'}
 </h1>
 <p className="mt-3 cb-body text-base sm:text-lg leading-relaxed">
 {isResetMode ? 'Choose a strong password for your account.' : 'Use a unique password to keep your workspace secure.'}
 </p>
 </div>

 <div className="cb-card p-8 sm:p-10">
 {success ? (
 <div>
 <p className="cb-body leading-relaxed">
 {isResetMode ? 'Your password has been reset. Redirecting to sign in…' : 'Redirecting to your dashboard…'}
 </p>
 <div className="mt-8">
 <Link to={isResetMode ? '/login' : '/'} className="cb-btn-primary w-full inline-flex">
 <ArrowLeft className="h-4 w-4" />
 {isResetMode ? 'Go to sign in' : 'Go to dashboard'}
 </Link>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-6">
 {!isResetMode && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Current password</label>
 <input
 type="password"
 value={currentPw}
 onChange={(e) => setCurrentPw(e.target.value)}
 className="cb-input"
 placeholder="••••••••••"
 disabled={loading}
 />
 </div>
 )}

 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">New password</label>
 <input
 type="password"
 value={newPw}
 onChange={(e) => setNewPw(e.target.value)}
 className="cb-input"
 placeholder="Minimum 8 characters"
 disabled={loading}
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Confirm password</label>
 <input
 type="password"
 value={confirmPw}
 onChange={(e) => setConfirmPw(e.target.value)}
 className="cb-input"
 placeholder="••••••••••"
 disabled={loading}
 />
 </div>

 {error && (
 <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium">
 <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
 <span>{error}</span>
 </div>
 )}

 <div className="pt-2">
 <button type="submit" disabled={loading} className="cb-btn-primary w-full">
 {loading ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 {isResetMode ? 'Resetting…' : 'Updating…'}
 </>
 ) : (
 <>
 {isResetMode ? 'Set password' : 'Update password'}
 <ShieldCheck className="h-4 w-4" />
 </>
 )}
 </button>
 </div>

 <div className="mt-8 pt-6 border-t border-border">
 {isResetMode ? (
 <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold cb-body hover:text-foreground transition-colors">
 <ArrowLeft className="h-4 w-4" />
 Back to sign in
 </Link>
 ) : (
 <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold cb-body hover:text-foreground transition-colors">
 <ArrowLeft className="h-4 w-4" />
 Back to dashboard
 </Link>
 )}
 </div>
 </form>
 )}
 </div>
 </div>
 </main>
 </PublicLayout>
 );
};

export default ChangePasswordPage;

