import React, { useState } from 'react';
import { Button } from './Button';
import { Lock, ScanLine, ShieldCheck, AlertCircle } from 'lucide-react';
import { ForgotPassword } from './ForgotPassword';

interface LoginProps {
  onLoginAttempt: (email: string, pass: string, onError: (type: 'account_not_found' | 'invalid_credentials', message: string) => void, onSuccess: () => void) => void;
  onSignupClick: () => void;
}

interface LoginError {
  type: 'account_not_found' | 'invalid_credentials' | '';
  message: string;
}

export const Login: React.FC<LoginProps> = ({ onLoginAttempt, onSignupClick }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'verifying' | 'success'>('credentials');
  const [error, setError] = useState<LoginError>({ type: '', message: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    setError({ type: '', message: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError({ type: '', message: '' });
    
    // Simulate API delay & Scanning UI
    setTimeout(() => {
      setStep('verifying');
      setTimeout(() => {
        // Call validation handler with error and success callbacks
        const errorCallback = (type: 'account_not_found' | 'invalid_credentials', message: string) => {
          setError({ type, message });
          setStep('credentials');
          setLoading(false);
        };
        const successCallback = () => {
          setStep('success');
          setTimeout(() => {
            // Redirect happens after success is shown
          }, 800);
        };
        onLoginAttempt(formData.email, formData.password, errorCallback, successCallback);
      }, 1500);
    }, 1000);
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

        {step === 'credentials' && (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-100 rounded-full mb-4">
                <Lock className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-black mb-2">Identify</h2>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Secure Environment Access
              </p>
            </div>

            {error.message && (
              <div className={`mb-6 p-4 border rounded flex gap-3 ${
                error.type === 'account_not_found' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  error.type === 'account_not_found' ? 'text-blue-600' : 'text-red-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    error.type === 'account_not_found' ? 'text-blue-900' : 'text-red-900'
                  }`}>
                    {error.message}
                  </p>
                  {error.type === 'account_not_found' && (
                    <button
                      type="button"
                      onClick={onSignupClick}
                      className="text-xs mt-2 font-semibold text-blue-600 hover:text-blue-700 border-b border-blue-600 hover:border-blue-700 pb-0.5"
                    >
                      Go to Sign Up
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">
                  Work Email
                </label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 font-mono text-sm focus:outline-none focus:border-black transition-colors disabled:bg-zinc-100 disabled:opacity-60"
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
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 font-mono text-sm focus:outline-none focus:border-black transition-colors disabled:bg-zinc-100 disabled:opacity-60"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="pt-4">
                <Button fullWidth type="submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Enter the Nexus'}
                </Button>
              </div>
            </div>
            
            <div className="mt-8 text-center space-y-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="block w-full text-xs text-zinc-400 hover:text-black transition-colors"
              >
                Forgot Password?
              </button>
              <button 
                type="button"
                onClick={onSignupClick}
                className="text-xs text-black font-semibold hover:text-zinc-600 transition-colors border-b border-black hover:border-zinc-600 pb-0.5"
              >
                New to the Nexus? Create an Account
              </button>
            </div>
          </form>
        )}

        {step === 'verifying' && (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <ScanLine className="w-12 h-12 text-black mx-auto mb-6 animate-pulse" />
            <h3 className="font-mono text-sm uppercase tracking-widest mb-2">Verifying Credentials</h3>
            <p className="text-xs text-zinc-400">Authenticating user...</p>
            
            <div className="mt-8 w-full bg-zinc-100 h-1 overflow-hidden">
              <div className="h-full bg-black animate-[loading_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <ShieldCheck className="w-12 h-12 text-black mx-auto mb-6" />
            <h3 className="font-mono text-sm uppercase tracking-widest mb-2">Access Granted</h3>
            <p className="text-xs text-zinc-400">Redirecting to Command Node...</p>
          </div>
        )}
      </div>
      
      {showForgotPassword && <ForgotPassword onClose={() => setShowForgotPassword(false)} />}
      
      <style>{`
        @keyframes loading {
          0% { width: 0%; transform: translateX(-100%); }
          100% { width: 100%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
