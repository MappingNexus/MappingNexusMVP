import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, Send } from 'lucide-react';
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
 if (!email) {
 setError('Please enter your email.');
 return;
 }

 setLoading(true);
 setError('');
 try {
 const res = await api.forgotPassword(email);
 if (res.success) setSent(true);
 else setError(res.message || 'Failed to send reset email.');
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
 <div className="cb-caption mb-4">PASSWORD RESET</div>
 <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-tight">
 Reset your password.
 </h1>
 <p className="mt-3 cb-body text-base sm:text-lg leading-relaxed">
 We’ll email a secure reset link if an account exists for that address.
 </p>
 </div>

 <div className="cb-card p-8 sm:p-10">
 {sent ? (
 <div>
 <p className="cb-body leading-relaxed">
 Check your inbox for <span className="text-foreground font-semibold">{email}</span>.
 </p>
 <div className="mt-8">
 <Link to="/login" className="cb-btn-primary w-full inline-flex">
 <ArrowLeft className="h-4 w-4" />
 Return to sign in
 </Link>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-6">
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
 Sending…
 </>
 ) : (
 <>
 Send reset link
 <Send className="h-4 w-4" />
 </>
 )}
 </button>
 </div>

 <div className="mt-8 pt-6 border-t border-border">
 <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold cb-body hover:text-foreground transition-colors">
 <ArrowLeft className="h-4 w-4" />
 Back to sign in
 </Link>
 </div>
 </form>
 )}
 </div>
 </div>
 </main>
 </PublicLayout>
 );
};

export default ForgotPasswordPage;

