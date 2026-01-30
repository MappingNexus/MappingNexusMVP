import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PricingCalculator } from './components/PricingCalculator';
import { Footer } from './components/Footer';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { DataIngestion } from './components/DataIngestion';
import { MappingLoader } from './components/MappingLoader';
import { Unauthorized } from './components/Unauthorized';
import { SubscriptionPage } from './components/SubscriptionPage';
import { AdminAnalytics } from './components/AdminAnalytics';
import { EnterpriseContact } from './components/EnterpriseContact';
import { RequestDemo } from './components/RequestDemo';
import { FounderSection } from './components/FounderSection';
import { Activity } from 'lucide-react';
import { Employee, CustomerRecord, Transaction } from './types';
import * as api from './services/api';

type Page = 'home' | 'login' | 'dashboard' | 'signup' | 'ingestion' | 'unauthorized' | 'subscribe' | 'admin' | 'enterprise' | 'demo';

interface UserState {
  id: string;
  email: string;
  isSubscribed: boolean;
  isVIP: boolean;
  isAuthenticated: boolean;
}

// ============ TEMPORARY BYPASS FLAG ============
// Set to true to bypass login and auto-authenticate as VIP
// Set to false to re-enable normal login flow
// TODO: Remove this in next build
const TEMP_BYPASS_LOGIN = true;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isMapping, setIsMapping] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Auth State
  const [user, setUser] = useState<UserState>({
    id: TEMP_BYPASS_LOGIN ? 'temp-admin-id' : '',
    email: TEMP_BYPASS_LOGIN ? 'tdhairyakumar@gmail.com' : '',
    isSubscribed: TEMP_BYPASS_LOGIN ? true : false,
    isVIP: TEMP_BYPASS_LOGIN ? true : false,
    isAuthenticated: TEMP_BYPASS_LOGIN ? true : false
  });

  // Admin data (only loaded when on admin page)
  const [customerDB, setCustomerDB] = useState<CustomerRecord[]>([]);
  const [transactionsDB, setTransactionsDB] = useState<Transaction[]>([]);

  // Load employees when user is authenticated
  useEffect(() => {
    if (user.isAuthenticated && user.id) {
      loadUserEmployees();
    }
  }, [user.isAuthenticated, user.id]);

  const loadUserEmployees = async () => {
    if (!user.id) return;

    setIsLoadingEmployees(true);
    const response = await api.getEmployees(user.id);

    if (response.success && response.employees) {
      // Data is already sanitized with String() on server
      setEmployees(response.employees);
    }
    setIsLoadingEmployees(false);
  };

  // Protected routes check
  useEffect(() => {
    // TEMPORARY: Skip protection if bypass is enabled
    if (TEMP_BYPASS_LOGIN) {
      return;
    }

    const protectedRoutes: Page[] = ['dashboard', 'ingestion', 'admin'];

    if (protectedRoutes.includes(currentPage)) {
      if (!user.isAuthenticated) {
        setCurrentPage('unauthorized');
      } else if (!user.isSubscribed && !user.isVIP && currentPage !== 'admin') {
        // For admin route, we'll handle VIP check separately
        setCurrentPage('subscribe');
      }
    }
  }, [currentPage, user.isAuthenticated, user.isSubscribed, user.isVIP]);

  const handleLoginAttempt = async (
    email: string,
    pass: string,
    onError: (type: 'account_not_found' | 'invalid_credentials', message: string) => void,
    onSuccess: () => void
  ) => {
    // TEMPORARY: Bypass API call if flag is enabled
    if (TEMP_BYPASS_LOGIN) {
      // Auto-login without API call
      setUser({
        id: 'temp-admin-id',
        email: email || 'tdhairyakumar@gmail.com',
        isSubscribed: true,
        isVIP: true,
        isAuthenticated: true
      });
      onSuccess();
      setTimeout(() => {
        setCurrentPage('dashboard');
      }, 800);
      return;
    }

    const response = await api.loginUser(email, pass);

    if (!response.success) {
      if (response.type === 'account_not_found') {
        onError('account_not_found', response.message || 'Account not found');
      } else {
        onError('invalid_credentials', response.message || 'Invalid credentials');
      }
      return;
    }

    // Set user state from API response
    setUser({
      id: String(response.user.id),
      email: String(response.user.email),
      isSubscribed: response.user.isSubscribed,
      isVIP: response.user.isVIP,
      isAuthenticated: true
    });

    onSuccess();

    // Navigate after success screen
    setTimeout(() => {
      navigateAfterAuth(response.user.isSubscribed);
    }, 800);
  };

  const handleSignupSuccess = async (email: string, password: string) => {
    try {
      const response = await api.signupUser(email, password);

      if (!response.success) {
        console.error('Signup failed:', response.message);
        // TODO: Show error to user in UI
        alert(`Signup failed: ${response.message}`);
        return;
      }

      // Set user state
      setUser({
        id: String(response.user.id),
        email: String(response.user.email),
        isSubscribed: false,
        isVIP: false,
        isAuthenticated: true
      });

      setCurrentPage('subscribe');
    } catch (error: any) {
      console.error('Unexpected signup error:', error);
      alert('An unexpected error occurred during signup. Check console for details.');
    }
  };

  // COUPON CODE HANDLER (kept as-is since it's a frontend feature)
  const handleCouponRedemption = (couponCode: string) => {
    if (couponCode.toUpperCase() === 'DKJ') {
      // For now, just navigate - in production, you'd call an API to apply coupon
      setUser(prev => ({ ...prev, isSubscribed: true }));
      navigateAfterAuth(true);
      return { success: true, message: 'Coupon applied! You now have 30 days of access.' };
    } else {
      return { success: false, message: 'Invalid coupon code. Please try again.' };
    }
  };

  const navigateAfterAuth = (hasSubscription: boolean) => {
    if (hasSubscription) {
      if (employees.length === 0) {
        setCurrentPage('ingestion');
      } else {
        setCurrentPage('dashboard');
      }
    } else {
      setCurrentPage('subscribe');
    }
  };

  const handleIngestionComplete = (data: Employee[]) => {
    // Data from DataIngestion component - save via API
    // For now, we'll handle this in Dashboard when they actually add employees
    setEmployees(data);
    setIsMapping(true);
  };

  // Add employee function - now uses API
  const handleAddEmployee = async (newEmployee: Employee) => {
    const response = await api.addEmployee(
      user.id,
      newEmployee.name,
      newEmployee.role,
      newEmployee.salary ? parseFloat(String(newEmployee.salary)) : undefined
    );

    if (response.success) {
      // Reload employees from server to stay in sync
      await loadUserEmployees();
    }
  };

  // Delete employee function - now uses API
  const handleDeleteEmployee = async (employeeId: string) => {
    const response = await api.deleteEmployee(employeeId, user.id);

    if (response.success) {
      // Reload employees from server
      await loadUserEmployees();
    }
  };

  const handleMappingComplete = () => {
    setIsMapping(false);
    setCurrentPage('dashboard');
  };

  // Admin Functions - now use API
  const loadAdminData = async () => {
    const customersResp = await api.getCustomers();
    const transactionsResp = await api.getTransactions();

    if (customersResp.success) {
      setCustomerDB(customersResp.customers || []);
    }

    if (transactionsResp.success) {
      setTransactionsDB(transactionsResp.transactions || []);
    }
  };

  // Load admin data when admin page is accessed
  useEffect(() => {
    if (currentPage === 'admin' && user.isVIP) {
      loadAdminData();
    }
  }, [currentPage, user.isVIP]);

  const handleApprovalApprove = async (targetEmail: string, amount: number) => {
    const response = await api.approveSubscription(targetEmail, amount);

    if (response.success) {
      // Reload admin data
      await loadAdminData();

      // If approving currently logged in user, update their state
      if (user.email === targetEmail) {
        setUser(prev => ({ ...prev, isSubscribed: true }));
      }
    }
  };

  const handleRevoke = async (targetEmail: string) => {
    const response = await api.revokeSubscription(targetEmail);

    if (response.success) {
      // Reload admin data
      await loadAdminData();

      // If revoking currently logged in user
      if (user.email === targetEmail) {
        setUser(prev => ({ ...prev, isSubscribed: false }));
        if (['dashboard', 'ingestion'].includes(currentPage)) {
          setCurrentPage('subscribe');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar
        onLoginClick={() => setCurrentPage('login')}
        onHomeClick={() => setCurrentPage('home')}
        onRequestDemoClick={() => setCurrentPage('demo')}
        currentPage={currentPage}
      />

      {isMapping && <MappingLoader onComplete={handleMappingComplete} />}

      {/* ADMIN OVERRIDE BUTTON: Only visible to VIP */}
      {user.isVIP && currentPage !== 'admin' && currentPage !== 'home' && currentPage !== 'demo' && (
        <button
          onClick={() => setCurrentPage('admin')}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#121212] text-white px-4 sm:px-5 py-2 sm:py-3 font-mono text-xs uppercase tracking-widest border border-zinc-700 shadow-2xl hover:bg-black hover:scale-105 transition-all"
        >
          Admin Center
        </button>
      )}

      <main className="flex-grow">
        {currentPage === 'home' && (
          <>
            <div className="bg-[#121212] w-full text-white border-b border-zinc-800">
              <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto text-center">
                <style>{`
                  @keyframes slideDownFade {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .hero-line-1 {
                    animation: slideDownFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                  }
                  .hero-line-2 {
                    opacity: 0;
                    animation: slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s forwards;
                  }
                `}</style>

                <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8 text-zinc-400">
                  <Activity className="w-4 h-4" />
                  <span className="font-mono text-xs uppercase tracking-widest">
                    Utilization Optimization
                  </span>
                </div>

                <div className="flex flex-col items-center mb-8 sm:mb-10">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 hero-line-1">
                    DONT JUST HIRE,
                  </h1>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white hero-line-2">
                    UTILIZE YOUR WORKFORCE.
                  </h1>
                </div>

                <p className="max-w-2xl mx-auto text-zinc-400 text-sm sm:text-base md:text-lg leading-relaxed font-light animate-in fade-in duration-1000 delay-700">
                  Stop searching for talent you already possess. Deploy the Mapping Nexus to
                  calculate the optimal utilization of your existing workforce.
                </p>
              </section>
            </div>

            <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-7xl mx-auto">
              <PricingCalculator />
              <div className="mt-8 sm:mt-12 text-center">
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                  * All plans include secure data encryption and role-based access control.
                </p>
              </div>
            </section>

            <FounderSection />
          </>
        )}

        {currentPage === 'login' && (
          <Login
            onLoginAttempt={handleLoginAttempt}
            onSignupClick={() => setCurrentPage('signup')}
          />
        )}

        {currentPage === 'signup' && (
          <Signup
            onSignupSuccess={handleSignupSuccess}
            onLoginClick={() => setCurrentPage('login')}
          />
        )}

        {currentPage === 'unauthorized' && (
          <Unauthorized onSubscribeClick={() => setCurrentPage('subscribe')} />
        )}

        {currentPage === 'subscribe' && (
          <SubscriptionPage
            userEmail={user.email}
            onCouponRedeem={handleCouponRedemption}
          />
        )}

        {currentPage === 'ingestion' && (
          <DataIngestion onComplete={handleIngestionComplete} />
        )}

        {currentPage === 'dashboard' && (
          <Dashboard
            employees={employees}
            isVIP={user.isVIP}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {currentPage === 'admin' && (
          <AdminAnalytics
            customers={customerDB}
            transactions={transactionsDB}
            onApprovalApprove={handleApprovalApprove}
            onRevoke={handleRevoke}
          />
        )}

        {currentPage === 'enterprise' && (
          <EnterpriseContact />
        )}

        {currentPage === 'demo' && (
          <RequestDemo />
        )}
      </main>

      {/* Footer remains on most pages, passes the navigation handler */}
      {(currentPage === 'home' || currentPage === 'enterprise') && (
        <Footer onEnterpriseClick={() => setCurrentPage('enterprise')} />
      )}
    </div>
  );
};

export default App;