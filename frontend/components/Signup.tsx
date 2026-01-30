import React, { useState } from 'react';
import { Button } from './Button';
import { UserPlus, Shield, CheckCircle2 } from 'lucide-react';

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

    // Call the async signup handler
    // The handler will navigate after success
    onSignupSuccess(formData.email, formData.password);

    // Show success state briefly
    setTimeout(() => {
      setStep('success');
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-zinc-50 px-6">
      <div className="max-w-md w-full bg-white border-2 border-zinc-200 p-8 md:p-12 relative overflow-hidden">

        {/* Decorator Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
        <div className="absolute top-4 right-4 flex gap-1">
          <div className="w-1 h-1 bg-zinc-300"></div>
          <div className="w-1 h-1 bg-zinc-300"></div>
          <div className="w-1 h-1 bg-zinc-300"></div>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-100 rounded-full mb-4">
                <UserPlus className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-black mb-2">Initiate Protocol</h2>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Create New Command Node
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 font-mono text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 font-mono text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 font-mono text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="pt-4">
                <Button fullWidth type="submit" disabled={loading || !isFormValid}>
                  {loading ? 'Processing...' : 'Create Account'}
                </Button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={onLoginClick}
                className="text-xs text-zinc-400 hover:text-black transition-colors border-b border-transparent hover:border-black"
              >
                Already have an account? Log In
              </button>
            </div>
          </form>
        )}

        {step === 'creating' && (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <Shield className="w-12 h-12 text-black mx-auto mb-6 animate-pulse" />
            <h3 className="font-mono text-sm uppercase tracking-widest mb-2">Encrypting Data</h3>
            <p className="text-xs text-zinc-400">Establishing secure node...</p>

            <div className="mt-8 w-full bg-zinc-100 h-1 overflow-hidden">
              <div className="h-full bg-black animate-[loading_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-black mx-auto mb-6" />
            <h3 className="font-mono text-sm uppercase tracking-widest mb-2">Node Created</h3>
            <p className="text-xs text-zinc-400">Redirecting to Dashboard...</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; transform: translateX(-100%); }
          100% { width: 100%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
