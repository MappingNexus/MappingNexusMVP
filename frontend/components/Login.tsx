import React, { useState } from 'react';
import { Button } from './Button';
import { Lock, ScanLine, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
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
    setError({ type: '', message: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError({ type: '', message: '' });

    setTimeout(() => {
      setStep('verifying');
      setTimeout(() => {
        const errorCallback = (type: 'account_not_found' | 'invalid_credentials', message: string) => {
          setError({ type, message });
          setStep('credentials');
          setLoading(false);
        };
        const successCallback = () => {
          setStep('success');
          setTimeout(() => {
            // Redirect handled by parent
          }, 800);
        };
        onLoginAttempt(formData.email, formData.password, errorCallback, successCallback);
      }, 1500);
    }, 1000);
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

          {step === 'credentials' && (
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-900 text-white rounded-2xl mb-6 shadow-lg shadow-zinc-200">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Welcome Back</h2>
                <p className="text-zinc-500 text-sm">
                  Enter your credentials to access the Nexus.
                </p>
              </div>

              {error.message && (
                <div className={`mb-8 p-4 rounded-xl flex gap-3 ${error.type === 'account_not_found'
                    ? 'bg-blue-50 text-blue-900 border border-blue-100'
                    : 'bg-red-50 text-red-900 border border-red-100'
                  }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">{error.message}</p>
                    {error.type === 'account_not_found' && (
                      <button
                        type="button"
                        onClick={onSignupClick}
                        className="mt-1 font-medium underline underline-offset-2 hover:text-blue-700"
                      >
                        Create an account &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">Work Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-semibold text-zinc-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="pt-4">
                  <Button
                    fullWidth
                    type="submit"
                    disabled={loading}
                    className="h-12 rounded-full text-base shadow-xl shadow-zinc-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm text-zinc-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={onSignupClick}
                      className="font-semibold text-zinc-900 hover:text-zinc-700 transition-colors"
                    >
                      Sign up now
                    </button>
                  </p>
                </div>
              </div>
            </form>
          )}

          {step === 'verifying' && (
            <div className="py-20 text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 bg-zinc-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white border border-zinc-100 rounded-full w-full h-full flex items-center justify-center shadow-xl">
                  <ScanLine className="w-8 h-8 text-zinc-900" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Verifying Credentials</h3>
              <p className="text-zinc-500 text-sm">Establishing secure handshake...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 mx-auto mb-8 bg-green-50 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Access Granted</h3>
              <p className="text-zinc-500 text-sm">Redirecting to dashboard...</p>
            </div>
          )}

        </div>
      </div>

      {showForgotPassword && <ForgotPassword onClose={() => setShowForgotPassword(false)} />}
    </div>
  );
};
