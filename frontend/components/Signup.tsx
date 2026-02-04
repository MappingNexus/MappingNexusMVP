import React, { useState } from 'react';
import { Button } from './Button';
import { UserPlus, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface SignupProps {
  onSignupSuccess: (email: string, password: string) => void;
  onLoginClick: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignupSuccess, onLoginClick }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isFormValid = formData.fullName && formData.email && formData.password;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setStep('creating');

    onSignupSuccess(formData.email, formData.password);

    setTimeout(() => {
      setStep('success');
    }, 1500);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-zinc-50">

      {/* Background Gradients (Matching Hero) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 md:p-12 relative overflow-hidden">

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-900 text-white rounded-2xl mb-6 shadow-lg shadow-zinc-200">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Create Account</h2>
                <p className="text-zinc-500 text-sm">
                  Join the network and start optimizing.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">Work Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="pt-4">
                  <Button fullWidth type="submit" disabled={loading || !isFormValid} className="h-12 rounded-full text-base shadow-xl shadow-zinc-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                    {loading ? 'Creating Account...' : 'Get Started'}
                  </Button>
                </div>
              </div>

              <div className="text-center pt-8">
                <p className="text-sm text-zinc-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="font-semibold text-zinc-900 hover:text-zinc-700 transition-colors"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </form>
          )}

          {step === 'creating' && (
            <div className="py-20 text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 bg-zinc-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white border border-zinc-100 rounded-full w-full h-full flex items-center justify-center shadow-xl">
                  <Shield className="w-8 h-8 text-zinc-900" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Securing Data</h3>
              <p className="text-zinc-500 text-sm">Encrypting your workspace...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 mx-auto mb-8 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Account Created</h3>
              <p className="text-zinc-500 text-sm">Welcome to the Nexus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
