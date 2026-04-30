import React, { useState } from 'react';
import { CheckCircle, Loader2, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
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
            if (response.success) {
                setSuccessMessage(response.message || 'Workspace created successfully.');
            } else {
                setError(response.message || 'Failed to create workspace.');
            }
        } catch {
            setError('Failed to reach onboarding service.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PublicLayout hideHeader>
            <main className="w-full max-w-lg mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
                
                <div className="text-center mb-10 w-full z-20">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
                        Create Workspace.
                    </h1>
                    <p className="text-muted-foreground text-lg font-light">
                        Onboard your company and provision an HR admin account.
                    </p>
                </div>

                <div className="w-full bg-card/70 backdrop-blur-2xl rounded-3xl border border-border/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-8 sm:p-10 z-10 transition-transform hover:-translate-y-1 duration-500">
                    
                    {successMessage ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-success" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">Workspace Initialized</h3>
                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                {successMessage}
                            </p>
                            <Link to="/login" className="w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/10 group">
                                Proceed to Sign In 
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Company Name</label>
                                <input 
                                    value={companyName} 
                                    onChange={e => setCompanyName(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                    placeholder="Acme Corp"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Admin Full Name</label>
                                <input 
                                    value={adminName} 
                                    onChange={e => setAdminName(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                    placeholder="Jane Smith"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Admin Work Email</label>
                                <input 
                                    type="email" 
                                    value={adminEmail} 
                                    onChange={e => setAdminEmail(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                    placeholder="jane.smith@acmecorp.com"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Admin Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        value={adminPassword} 
                                        onChange={e => setAdminPassword(e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                        placeholder="Min. 8 characters"
                                        disabled={loading}
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Confirm Password</label>
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                    placeholder="Repeat password"
                                    disabled={loading}
                                    minLength={8}
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="pt-4">
                                <button type="submit" disabled={loading}
                                    className="w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10 dark:shadow-white/10 group">
                                    {loading ? (
                                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Provisioning...</>
                                    ) : (
                                        <>
                                            Provision Workspace
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-border/50 text-center">
                                <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                    Already have a workspace? Log In
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </PublicLayout>
    );
};

export default OnboardingPage;
