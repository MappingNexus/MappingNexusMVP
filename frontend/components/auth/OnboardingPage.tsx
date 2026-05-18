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

                <div className="w-full bg-white/70 dark:bg-[#111111]/70 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-8 sm:p-10 z-10 transition-transform hover:-translate-y-1 duration-500">
                    
                    {successMessage ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#111] dark:text-white mb-3">Workspace Initialized</h3>
                            <p className="text-[#666666] dark:text-[#a0a0a0] mb-8 leading-relaxed">
                                {successMessage}
                            </p>
                            <Link to="/login" className="w-full flex items-center justify-center px-6 py-4 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/10 group">
                                Proceed to Sign In 
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                                <input 
                                    value={companyName} 
                                    onChange={e => setCompanyName(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                    placeholder="Acme Corp"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Full Name</label>
                                <input 
                                    value={adminName} 
                                    onChange={e => setAdminName(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                    placeholder="Jane Smith"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Work Email</label>
                                <input 
                                    type="email" 
                                    value={adminEmail} 
                                    onChange={e => setAdminEmail(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                    placeholder="jane.smith@acmecorp.com"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        value={adminPassword} 
                                        onChange={e => setAdminPassword(e.target.value)}
                                        className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pr-12 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                        placeholder="Min. 8 characters"
                                        disabled={loading}
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#111] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white/50 transition-all"
                                    placeholder="Repeat password"
                                    disabled={loading}
                                    minLength={8}
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

