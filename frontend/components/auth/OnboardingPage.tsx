import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../services/api';
import PublicLayout from '../shared/PublicLayout';

const OnboardingPage: React.FC = () => {
 const [companyName, setCompanyName] = useState('');
 const [adminName, setAdminName] = useState('');
 const [adminEmail, setAdminEmail] = useState('');
 const [adminPassword, setAdminPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [successMessage, setSuccessMessage] = useState('');

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError('');
 setSuccessMessage('');

 if (adminPassword !== confirmPassword) {
 setError('Passwords do not match.');
 setLoading(false);
 return;
 }

 if (adminPassword.length < 8) {
 setError('Password must be at least 8 characters.');
 setLoading(false);
 return;
 }

 try {
 const response = await api.onboardCompany({ companyName, adminName, adminEmail, adminPassword });
 if (response.success) setSuccessMessage(response.message || 'Workspace created successfully.');
 else setError(response.message || 'Failed to create workspace.');
 } catch {
 setError('Failed to reach onboarding service.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <PublicLayout hideHeader>
 <main className="cb-container pt-16 pb-24">
 <div className="max-w-2xl mx-auto">
 <div className="mb-10 text-center">
 {/* <div className="cb-caption mb-4">GET STARTED</div> */}
 <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-tight">
 Create a workspace.
 </h1>
 <p className="mt-3 cb-body text-base sm:text-lg leading-relaxed">
 Provision your company workspace and create an HR admin account.
 </p>
 </div>

 <div className="cb-card p-8 sm:p-10">
 {successMessage ? (
 <div>
 <h2 className="text-xl font-semibold tracking-tight">Workspace initialized</h2>
 <p className="mt-3 cb-body leading-relaxed">{successMessage}</p>
 <div className="mt-8 flex flex-col sm:flex-row gap-3">
 <Link to="/login" className="cb-btn-primary inline-flex">
 Continue to sign in <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="grid gap-6 md:grid-cols-2">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Company name</label>
 <input
 value={companyName}
 onChange={(e) => setCompanyName(e.target.value)}
 className="cb-input"
 placeholder="Acme Corp"
 disabled={loading}
 />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Admin full name</label>
 <input
 value={adminName}
 onChange={(e) => setAdminName(e.target.value)}
 className="cb-input"
 placeholder="Jane Smith"
 disabled={loading}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Admin email</label>
 <input
 value={adminEmail}
 onChange={(e) => setAdminEmail(e.target.value)}
 className="cb-input"
 placeholder="jane.smith@acmecorp.com"
 disabled={loading}
 />
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Admin password</label>
 <div className="relative">
 <input
 type={showPassword ? 'text' : 'password'}
 value={adminPassword}
 onChange={(e) => setAdminPassword(e.target.value)}
 className="cb-input pr-12"
 placeholder="Min. 8 characters"
 disabled={loading}
 minLength={8}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
 tabIndex={-1}
 aria-label={showPassword ? 'Hide password' : 'Show password'}
 >
 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
 </button>
 </div>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-2">Confirm password</label>
 <input
 type={showPassword ? 'text' : 'password'}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 className="cb-input"
 placeholder="Repeat password"
 disabled={loading}
 minLength={8}
 />
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
 {loading ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Provisioning…
 </>
 ) : (
 <>
 Provision workspace <ArrowRight className="h-4 w-4" />
 </>
 )}
 </button>
 </div>

 <div className="mt-8 pt-6 border-t border-border text-center">
 <Link to="/login" className="text-sm font-semibold cb-body hover:text-foreground transition-colors">
 Already have a workspace? Sign in
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

export default OnboardingPage;

