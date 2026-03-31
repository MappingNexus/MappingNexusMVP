import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Lock, AlertTriangle, ShieldCheck, RefreshCw, KeyRound, Ban, Trash2, AlertCircle } from 'lucide-react';
import { CustomerRecord, Transaction } from '../types';
import { Button } from './Button';
import { ApprovalModal } from './ApprovalModal';
import { EarningsGrid } from './EarningsGrid';
import { RevenueCharts } from './RevenueCharts';
import { clearAllAppData, getStorageStats } from '../utils/storage';

interface AdminAnalyticsProps {
  customers: CustomerRecord[];
  transactions: Transaction[];
  onApprovalApprove: (email: string, amount: number) => void;
  onRevoke: (email: string) => void;
  onVerifyPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ 
  customers, 
  transactions,
  onApprovalApprove,
  onRevoke,
  onVerifyPin
}) => {
  // --- SECURITY PROTOCOL STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // --- APPROVAL MODAL STATE ---
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedEmailForApproval, setSelectedEmailForApproval] = useState('');

  // --- STORAGE MANAGEMENT STATE ---
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [storageStats, setStorageStats] = useState({ totalItems: 0, totalSize: '0 KB' });

  // --- PASSWORD RESET STATE ---
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [resetUserEmail, setResetUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetMsg, setPasswordResetMsg] = useState('');

  // ============ TEMPORARY BYPASS FLAG ============
  // Set to true to bypass admin PIN check
  // Set to false to re-enable PIN verification
  // TODO: Remove this in next build
  const TEMP_BYPASS_ADMIN_PIN = false;

  // --- SECURITY LOGIC ---
  useEffect(() => {
    // TEMPORARY: Auto-authenticate if bypass is enabled
    if (TEMP_BYPASS_ADMIN_PIN) {
      setIsAuthenticated(true);
      return;
    }

    // Check local storage for persistent lockout
    const storedLockout = localStorage.getItem('nexus_admin_lockout');
    if (storedLockout) {
      const lockTime = parseInt(storedLockout);
      if (Date.now() < lockTime) {
        setLockoutTime(lockTime);
      } else {
        localStorage.removeItem('nexus_admin_lockout');
      }
    }
    // Update storage stats
    setStorageStats(getStorageStats());
  }, []);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // TEMPORARY: Auto-approve if bypass is enabled
    if (TEMP_BYPASS_ADMIN_PIN) {
      setIsAuthenticated(true);
      setErrorMsg('');
      return;
    }

    if (lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 60000);
      setErrorMsg(`TERMINAL LOCKED. RETRY IN ${remaining} MINUTES.`);
      return;
    }

    const verification = await onVerifyPin(pin);
    if (verification.success) {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      
      if (newAttempts >= 3) {
        const lockDuration = 10 * 60 * 1000; // 10 minutes
        const lockUntil = Date.now() + lockDuration;
        setLockoutTime(lockUntil);
        localStorage.setItem('nexus_admin_lockout', lockUntil.toString());
        setErrorMsg('SECURITY BREACH DETECTED. TERMINAL LOCKED FOR 10 MIN.');
      } else {
        setErrorMsg(verification.message || `INVALID PIN. ATTEMPTS REMAINING: ${3 - newAttempts}`);
      }
    }
  };

  // --- ANALYTICS ENGINE LOGIC ---
  const privilegedEmails = ['tdhairyakumar@gmail.com', 'sharvesheve@gmail.com'];
  const revenueTransactions = transactions.filter(t => 
    !privilegedEmails.includes(t.email) && 
    t.status === 'Completed'
  );

  const calculateEarnings = () => {
    const now = new Date();
    let perDay = 0, perWeek = 0, perMonth = 0, perQuarter = 0, perYear = 0, lifetime = 0;

    revenueTransactions.forEach(t => {
      const tDate = new Date(t.transactionDate);
      const daysAgo = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);

      if (daysAgo <= 1) perDay += t.amount;
      if (daysAgo <= 7) perWeek += t.amount;
      if (daysAgo <= 30) perMonth += t.amount;
      if (daysAgo <= 90) perQuarter += t.amount;
      if (daysAgo <= 365) perYear += t.amount;
      lifetime += t.amount;
    });

    return { perDay, perWeek, perMonth, perQuarter, perYear, lifetime };
  };

  const earningsMetrics = calculateEarnings();
  const totalMonthlyRevenue = earningsMetrics.perMonth;

  // Helper to calculate days remaining
  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return 0;
    const accessExpiry = new Date(dateString).getTime();
    const now = new Date().getTime();
    const daysRemaining = (accessExpiry - now) / (1000 * 3600 * 24);
    return Math.floor(daysRemaining);
  };

  const handleOpenApprovalModal = (email: string) => {
    setSelectedEmailForApproval(email);
    setIsApprovalModalOpen(true);
  };

  const handleApprovalSubmit = (amount: number) => {
    onApprovalApprove(selectedEmailForApproval, amount);
    setIsApprovalModalOpen(false);
    setSelectedEmailForApproval('');
  };

  const handleClearAllData = () => {
    if (window.confirm('⚠️ CRITICAL: This will DELETE ALL user data (credentials, customers, employees, transactions). This cannot be undone. Type CONFIRM to proceed.')) {
      const confirmation = window.prompt('Type CONFIRM to proceed:');
      if (confirmation === 'CONFIRM') {
        clearAllAppData();
        setShowClearDataDialog(false);
        alert('✅ All data cleared from localStorage. Page will reload...');
        window.location.reload();
      } else {
        alert('❌ Operation cancelled.');
      }
    }
  };

  const handleCancelSubscription = (email: string) => {
    onRevoke(email);
    alert(`Revoked subscription for ${email}.`);
  };

  const handleResetPassword = () => {
    if (!resetUserEmail || !newPassword || !confirmPassword) {
      setPasswordResetMsg('❌ All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordResetMsg('❌ Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordResetMsg('❌ Passwords do not match');
      return;
    }

    // Load credentials from localStorage
    const credentialsStr = localStorage.getItem('nexus_user_credentials');
    const credentials = credentialsStr ? JSON.parse(credentialsStr) : {};

    if (!credentials[resetUserEmail]) {
      setPasswordResetMsg('❌ User not found');
      return;
    }

    // Update password
    credentials[resetUserEmail].password = newPassword;
    localStorage.setItem('nexus_user_credentials', JSON.stringify(credentials));

    setPasswordResetMsg(`✅ Password reset successfully for ${resetUserEmail}`);
    setTimeout(() => {
      setShowPasswordResetModal(false);
      setResetUserEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordResetMsg('');
    }, 2000);
  };

  // --- RENDER: SECURITY GATE ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono">
        <div className="max-w-md w-full bg-[#121212] border border-zinc-800 p-12 relative overflow-hidden shadow-2xl">
          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-black border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6">
              {lockoutTime ? <Ban className="w-8 h-8 text-red-600" /> : <Lock className="w-8 h-8 text-zinc-400" />}
            </div>
            
            <h2 className="text-xl text-white font-bold tracking-[0.2em] mb-2">ADMIN CLEARANCE</h2>
            <p className="text-[10px] text-zinc-500 uppercase mb-8">Biometric verified. Pin required.</p>

            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="relative">
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  disabled={!!lockoutTime}
                  className="w-full bg-black border-2 border-zinc-800 text-center text-2xl tracking-[1em] text-white py-4 focus:outline-none focus:border-white transition-colors disabled:opacity-50"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
              
              {errorMsg && (
                <div className="text-[10px] text-red-500 font-bold bg-red-900/10 border border-red-900/30 p-2 animate-pulse">
                  {errorMsg}
                </div>
              )}

              <button 
                type="submit"
                disabled={!!lockoutTime}
                className="w-full bg-white text-black text-xs font-bold uppercase tracking-widest py-4 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lockoutTime ? 'TERMINAL LOCKED' : 'AUTHENTICATE'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#121212] text-zinc-300 p-6 md:p-12 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-end border-b border-zinc-800 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-green-500" />
            <h1 className="text-2xl text-white font-bold uppercase tracking-widest">Admin Command Center</h1>
          </div>
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            Security Level 5 • Write Access Enabled
          </p>
        </div>

        <div className="mt-8 md:mt-0 flex gap-6">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase text-zinc-500 mb-1">Monthly Revenue</p>
            <div className="text-3xl font-light text-white tracking-tighter flex items-center justify-end gap-1">
              <span className="text-zinc-600">$</span>
              {totalMonthlyRevenue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })} 
              <span className="text-xs font-mono text-zinc-500 ml-1">/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* STORAGE & DATA MANAGEMENT */}
      <div className="max-w-7xl mx-auto mb-8 bg-amber-900/20 border border-amber-700 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs font-mono text-amber-300 uppercase">Storage Status</p>
            <p className="text-sm text-amber-200">{storageStats.totalItems} databases stored • {storageStats.totalSize} total</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowPasswordResetModal(true)}
            className="text-xs py-2 px-4 h-auto bg-blue-900/30 text-blue-400 border border-blue-700 hover:bg-blue-900/50"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-3 h-3" />
              RESET PASSWORD
            </div>
          </Button>
          <Button
            onClick={() => setShowClearDataDialog(true)}
            className="text-xs py-2 px-4 h-auto bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/50"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3 h-3" />
              CLEAR ALL DATA
            </div>
          </Button>
        </div>
      </div>

      {/* CLEAR DATA CONFIRMATION DIALOG */}
      {showClearDataDialog && (
        <div className="max-w-7xl mx-auto mb-8 bg-red-900/40 border-2 border-red-700 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg text-red-300 font-bold mb-2">⚠️ CRITICAL ACTION</h3>
              <p className="text-sm text-red-200 mb-4">This will permanently delete ALL user data including:</p>
              <ul className="text-xs text-red-200 mb-6 space-y-1 ml-4">
                <li>• All user credentials and passwords</li>
                <li>• All customer records and subscriptions</li>
                <li>• All employee data per user</li>
                <li>• All transaction history</li>
              </ul>
              <p className="text-xs text-red-300 font-mono mb-4">This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button
                  onClick={handleClearAllData}
                  className="text-xs py-2 px-4 h-auto bg-red-700 text-white hover:bg-red-600"
                >
                  I UNDERSTAND - DELETE ALL
                </Button>
                <Button
                  onClick={() => setShowClearDataDialog(false)}
                  className="text-xs py-2 px-4 h-auto bg-transparent text-zinc-300 border border-zinc-600 hover:border-zinc-400"
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showPasswordResetModal && (
        <div className="max-w-7xl mx-auto mb-8 bg-blue-900/40 border-2 border-blue-700 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <KeyRound className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg text-blue-300 font-bold mb-4">🔐 Reset User Password</h3>
              
              {passwordResetMsg && (
                <div className={`text-sm font-mono p-3 rounded mb-4 ${
                  passwordResetMsg.startsWith('✅') 
                    ? 'bg-green-900/30 text-green-400 border border-green-700' 
                    : 'bg-red-900/30 text-red-400 border border-red-700'
                }`}>
                  {passwordResetMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-blue-300 mb-2">User Email</label>
                  <input
                    type="email"
                    value={resetUserEmail}
                    onChange={(e) => {
                      setResetUserEmail(e.target.value);
                      setPasswordResetMsg('');
                    }}
                    placeholder="user@example.com"
                    className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-blue-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordResetMsg('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-blue-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordResetMsg('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleResetPassword}
                    className="text-xs py-2 px-4 h-auto bg-blue-700 text-white hover:bg-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-3 h-3" />
                      RESET PASSWORD
                    </div>
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordResetModal(false);
                      setResetUserEmail('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordResetMsg('');
                    }}
                    className="text-xs py-2 px-4 h-auto bg-transparent text-zinc-300 border border-zinc-600 hover:border-zinc-400"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EARNINGS GRID */}
      <div className="max-w-7xl mx-auto mb-12">
        <EarningsGrid metrics={earningsMetrics} />
      </div>

      {/* REVENUE CHARTS */}
      <div className="max-w-7xl mx-auto mb-12">
        <RevenueCharts transactions={transactions} />
      </div>

      {/* SUBSCRIPTION MANAGEMENT TABLE */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-black border border-zinc-800 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-[#0A0A0A] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <h3 className="font-mono text-xs uppercase text-zinc-400">Subscription Management</h3>
            </div>
            <div className="text-[10px] font-mono text-zinc-600">
              {customers.filter(c => !privilegedEmails.includes(c.email)).length} Active Users
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                  <th className="px-6 py-4 font-normal">User Identity</th>
                  <th className="px-6 py-4 font-normal">Subscription Tier</th>
                  <th className="px-6 py-4 font-normal">Access Status</th>
                  <th className="px-6 py-4 font-normal">Time Remaining</th>
                  <th className="px-6 py-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {customers.map((cust, idx) => {
                  if (privilegedEmails.includes(cust.email)) return null;

                  const daysRemaining = getDaysRemaining(cust.accessExpiry);
                  const isExpired = daysRemaining <= 0;
                  const isVIP = cust.accessLevel === 'VIP' || cust.accessLevel === 'Admin';

                  return (
                    <tr 
                      key={idx} 
                      className={`
                        transition-colors
                        ${isExpired && !isVIP ? 'bg-[#441111]/30 hover:bg-[#441111]/50' : 'hover:bg-zinc-900'}
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{cust.email}</div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                          Joined: {cust.lastPaymentDate ? new Date(cust.lastPaymentDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                         <span className="text-xs font-mono text-zinc-400">
                           ${cust.monthlySpend}/mo
                         </span>
                      </td>

                      <td className="px-6 py-4">
                        {isExpired && !isVIP ? (
                          <div className="inline-flex items-center gap-2 text-[#ff4444] text-[10px] font-mono font-bold uppercase border border-[#ff4444] px-2 py-1 bg-[#ff4444]/10">
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 text-[#00ff9d] text-[10px] font-mono font-bold uppercase border border-[#00ff9d] px-2 py-1 bg-[#00ff9d]/10">
                            <ShieldCheck className="w-3 h-3" />
                            Active
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm ${isExpired ? 'text-red-400' : 'text-zinc-300'}`}>
                          {isVIP ? '∞' : `${daysRemaining} Days`}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {isExpired ? (
                            <Button
                              onClick={() => handleOpenApprovalModal(cust.email)}
                              className="text-[10px] py-2 px-3 h-auto bg-white text-black hover:bg-zinc-200 border-transparent"
                            >
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-3 h-3" />
                                REACTIVATE
                              </div>
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleOpenApprovalModal(cust.email)}
                                className="text-[10px] py-2 px-3 h-auto bg-green-600 text-white hover:bg-green-700 border-transparent"
                              >
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-3 h-3" />
                                  APPROVE
                                </div>
                              </Button>

                              <Button
                                onClick={() => handleCancelSubscription(cust.email)}
                                className="text-[10px] py-2 px-3 h-auto bg-transparent text-red-500 border border-red-700 hover:bg-red-900/20 hover:border-red-500"
                              >
                                <div className="flex items-center gap-2">
                                  <Trash2 className="w-3 h-3" />
                                  CANCEL
                                </div>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* APPROVAL MODAL */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        email={selectedEmailForApproval}
        onApprove={handleApprovalSubmit}
        onCancel={() => {
          setIsApprovalModalOpen(false);
          setSelectedEmailForApproval('');
        }}
      />
    </div>
  );
};
