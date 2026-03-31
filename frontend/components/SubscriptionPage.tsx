import React from 'react';
import { PricingCalculator } from './PricingCalculator';
import { Button } from './Button';
import { Mail, Lock, ShieldAlert, Ticket, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface SubscriptionPageProps {
  userEmail: string;
  onCouponRedeem?: (coupon: string) => { success: boolean; message: string };
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ userEmail, onCouponRedeem }) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ success: boolean; message: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  
  // Logic 2: THE VIP BYPASS (Still checking for display purposes if needed, but primary flow is manual)
  const isVIP = ['tdhairyakumar@gmail.com', 'sharvesheve@gmail.com'].includes(userEmail);

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    // Simulate API delay
    setTimeout(() => {
      if (onCouponRedeem) {
        const result = onCouponRedeem(couponCode);
        setCouponResult(result);
      }
      setCouponLoading(false);
      setCouponCode('');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Secure Your Command Node</h2>
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
          Select a tier to activate the Nexus Engine
        </p>
      </div>

      <PricingCalculator hideButton={true} />

      <div className="max-w-3xl mx-auto mt-16 animate-in fade-in slide-in-from-bottom-8">
        
        {/* Manual Payment Instruction Panel */}
        <div className="bg-zinc-900 text-white p-8 md:p-12 border-2 border-black shadow-2xl relative overflow-hidden">
           
           {/* Background subtle effect */}
           <div className="absolute top-0 right-0 p-12 opacity-10">
             <ShieldAlert className="w-48 h-48" />
           </div>

           <div className="relative z-10 text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                <div className="bg-white text-black p-2 rounded-full">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest">Access Protocol: Manual Verification</h3>
             </div>

             <div className="space-y-6 mb-8">
               <p className="font-mono text-sm leading-relaxed text-zinc-300">
                 <strong className="text-white">Attention Node {userEmail}:</strong><br/>
                 The Nexus automated gateway is currently in maintenance mode. To initialize your subscription, a manual security clearance is required.
               </p>
               
               <div className="bg-white/10 p-4 border-l-2 border-white">
                 <p className="text-sm font-light">
                   Please contact the System Administrator to receive your unique <strong>Payment Link (GPay)</strong>. 
                   Once the transaction is verified, your 30-day access pass will be granted within 1 hour.
                 </p>
               </div>
             </div>

             <div className="flex flex-col md:flex-row items-center gap-6">
               <a 
                 href={`mailto:tiwari.dhairya@zohomail.in?subject=Nexus Access Request: ${userEmail}&body=I would like to activate a subscription for account: ${userEmail}. Please send payment details.`}
                 className="w-full md:w-auto"
               >
                 <Button className="bg-white text-black hover:bg-zinc-200 border-none w-full md:w-auto px-8 py-4">
                   <div className="flex items-center justify-center gap-2">
                     <Mail className="w-4 h-4" />
                     Contact Administrator
                   </div>
                 </Button>
               </a>
               
               <p className="text-[10px] font-mono text-zinc-500 uppercase">
                 * Status: Awaiting Admin Approval
               </p>
             </div>
           </div>
        </div>

        {/* COUPON CODE SECTION */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-zinc-50 border border-zinc-300 p-6 md:p-8 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-black text-white p-2 rounded-full">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wide">Have a Coupon Code?</h3>
            </div>

            <form onSubmit={handleCouponSubmit} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-3 border border-zinc-300 rounded font-mono text-sm uppercase focus:outline-none focus:border-black transition-colors"
                  disabled={couponLoading}
                />
                <Button
                  type="submit"
                  disabled={!couponCode.trim() || couponLoading}
                  className="bg-black text-white hover:bg-zinc-800 border-none px-6 py-3 uppercase font-semibold text-sm whitespace-nowrap"
                >
                  {couponLoading ? 'Validating...' : 'Apply'}
                </Button>
              </div>

              {couponResult && (
                <div className={`p-4 rounded flex gap-3 items-start ${
                  couponResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {couponResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm font-medium ${couponResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {couponResult.message}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-400">
            Already paid? <a href="#" onClick={() => window.location.reload()} className="underline hover:text-black">Refresh Status</a>
          </p>
        </div>

      </div>
    </div>
  );
};
