import React, { useEffect, useState } from 'react';
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
import FounderSection from './components/FounderSection';
import { HeroSection } from './components/HeroSection';
import { FaqSection } from './components/FaqSection';
import { Employee, CustomerRecord, Transaction } from './types';
import * as api from './services/api';

type Page = 'home' | 'login' | 'dashboard' | 'signup' | 'ingestion' | 'unauthorized' | 'subscribe' | 'admin' | 'enterprise' | 'demo';
type AccessLevel = 'Standard' | 'VIP' | 'Admin';

interface UserState {
  id: string;
  email: string;
  accessLevel: AccessLevel;
  isSubscribed: boolean;
  isVIP: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  token: string;
}

const TEMP_BYPASS_LOGIN = false;

const EMPTY_USER: UserState = {
  id: '',
  email: '',
  accessLevel: 'Standard',
  isSubscribed: false,
  isVIP: false,
  isAdmin: false,
  isAuthenticated: false,
  token: '',
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isMapping, setIsMapping] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [customerDB, setCustomerDB] = useState<CustomerRecord[]>([]);
  const [transactionsDB, setTransactionsDB] = useState<Transaction[]>([]);
  const [user, setUser] = useState<UserState>(() => {
    if (!TEMP_BYPASS_LOGIN) {
      return EMPTY_USER;
    }

    return {
      id: 'temp-admin-id',
      email: 'tdhairyakumar@gmail.com',
      accessLevel: 'Admin',
      isSubscribed: true,
      isVIP: true,
      isAdmin: true,
      isAuthenticated: true,
      token: '',
    };
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const canAccessWorkspace = user.isAuthenticated && (user.isSubscribed || user.isVIP || user.isAdmin);

  const persistUser = (nextUser: UserState) => {
    setUser(nextUser);
    localStorage.setItem('nexus_user', JSON.stringify(nextUser));
  };

  const clearStoredUser = () => {
    localStorage.removeItem('nexus_user');
    setUser(EMPTY_USER);
  };

  const normalizeUser = (responseUser: any): UserState => {
    const accessLevel = (responseUser.accessLevel === 'Admin' || responseUser.accessLevel === 'VIP')
      ? responseUser.accessLevel as AccessLevel
      : 'Standard';

    return {
      id: String(responseUser.id),
      email: String(responseUser.email),
      accessLevel,
      isSubscribed: Boolean(responseUser.isSubscribed),
      isVIP: Boolean(responseUser.isVIP),
      isAdmin: Boolean(responseUser.isAdmin),
      isAuthenticated: true,
      token: String(responseUser.token || ''),
    };
  };

  const navigateAfterAuth = (nextUser: UserState) => {
    if (nextUser.isAdmin) {
      setCurrentPage('admin');
      return;
    }

    if (nextUser.isSubscribed || nextUser.isVIP) {
      setCurrentPage(employees.length === 0 ? 'ingestion' : 'dashboard');
      return;
    }

    setCurrentPage('subscribe');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (!savedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as UserState;
      if (!parsedUser.token) {
        localStorage.removeItem('nexus_user');
        return;
      }

      setUser(parsedUser);

      if (parsedUser.isAuthenticated) {
        navigateAfterAuth(parsedUser);
      }
    } catch {
      localStorage.removeItem('nexus_user');
    }
  }, []);

  useEffect(() => {
    if (user.isAuthenticated && user.id && canAccessWorkspace) {
      loadUserEmployees();
    } else if (!user.isAuthenticated) {
      setEmployees([]);
    }
  }, [user.id, user.isAuthenticated, canAccessWorkspace]);

  const loadUserEmployees = async () => {
    if (!user.id) return;

    setIsLoadingEmployees(true);
    const response = await api.getEmployees(user.id);

    if (response.success && response.employees) {
      setEmployees(response.employees);
    }

    setIsLoadingEmployees(false);
  };

  useEffect(() => {
    if (TEMP_BYPASS_LOGIN) {
      return;
    }

    const protectedRoutes: Page[] = ['dashboard', 'ingestion', 'admin', 'subscribe'];
    if (!protectedRoutes.includes(currentPage)) {
      return;
    }

    if (!user.isAuthenticated) {
      setCurrentPage('unauthorized');
      return;
    }

    if (currentPage === 'admin') {
      if (!user.isAdmin) {
        setCurrentPage('unauthorized');
      }
      return;
    }

    if ((currentPage === 'dashboard' || currentPage === 'ingestion') && !canAccessWorkspace) {
      setCurrentPage('subscribe');
    }
  }, [currentPage, user, canAccessWorkspace]);

  const handleLoginAttempt = async (
    email: string,
    pass: string,
    onError: (type: 'account_not_found' | 'invalid_credentials', message: string) => void,
    onSuccess: () => void
  ) => {
    if (TEMP_BYPASS_LOGIN) {
      const bypassUser: UserState = {
        id: 'temp-admin-id',
        email: email || 'tdhairyakumar@gmail.com',
        accessLevel: 'Admin',
        isSubscribed: true,
        isVIP: true,
        isAdmin: true,
        isAuthenticated: true,
        token: '',
      };
      setUser(bypassUser);
      onSuccess();
      setTimeout(() => setCurrentPage('admin'), 800);
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

    const nextUser = normalizeUser(response.user);
    persistUser(nextUser);
    onSuccess();
    setTimeout(() => navigateAfterAuth(nextUser), 800);
  };

  const handleGoogleLoginSuccess = async (token: string) => {
    const response = await api.googleLogin(token);

    if (!response.success) {
      alert('Google Authentication Failed: ' + (response.message || 'Unknown error'));
      return;
    }

    const nextUser = normalizeUser(response.user);
    persistUser(nextUser);
    navigateAfterAuth(nextUser);
  };

  const handleSignupSuccess = async (email: string, password: string) => {
    try {
      const response = await api.signupUser(email, password);

      if (!response.success) {
        alert(`Signup failed: ${response.message}`);
        return;
      }

      const nextUser = normalizeUser(response.user);
      persistUser(nextUser);
      setCurrentPage('subscribe');
    } catch (error: any) {
      alert('An unexpected error occurred during signup. Check console for details.');
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    setCurrentPage('home');
  };

  const handleCouponRedemption = (couponCode: string) => {
    if (couponCode.toUpperCase() === 'DKJ') {
      const nextUser = {
        ...user,
        isSubscribed: true,
      };
      persistUser(nextUser);
      navigateAfterAuth(nextUser);
      return { success: true, message: 'Coupon applied! You now have 30 days of access.' };
    }

    return { success: false, message: 'Invalid coupon code. Please try again.' };
  };

  const handleIngestionComplete = async (data: Employee[]) => {
    setIsLoadingEmployees(true);
    setEmployees(prev => [...prev, ...data]);

    const response = await api.bulkAddEmployees(user.id, data);

    if (response.success) {
      await loadUserEmployees();
      setIsMapping(true);
    } else {
      alert('Nexus Protocol Warning: Connectivity interruption. Nodes cached locally but not synced.');
      setIsLoadingEmployees(false);
      setIsMapping(true);
    }
  };

  const handleAddEmployee = async (newEmployee: Employee) => {
    const response = await api.addEmployee(
      user.id,
      newEmployee.name,
      newEmployee.role,
      newEmployee.salary ? parseFloat(String(newEmployee.salary)) : undefined,
      {
        status: newEmployee.status,
        efficiency: newEmployee.efficiency,
        location: newEmployee.location,
        skills: newEmployee.skills,
        travelReady: newEmployee.travelReady,
        pastMissions: newEmployee.pastMissions,
        education: newEmployee.education,
      }
    );

    if (response.success) {
      await loadUserEmployees();
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    const response = await api.deleteEmployee(employeeId, user.id);

    if (response.success) {
      await loadUserEmployees();
    }
  };

  const handleMappingComplete = () => {
    setIsMapping(false);
    setCurrentPage('dashboard');
  };

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

  useEffect(() => {
    if (currentPage === 'admin' && user.isAdmin) {
      loadAdminData();
    }
  }, [currentPage, user.isAdmin]);

  const handleApprovalApprove = async (targetEmail: string, amount: number) => {
    const response = await api.approveSubscription(targetEmail, amount);

    if (response.success) {
      await loadAdminData();

      if (user.email === targetEmail) {
        const nextUser = { ...user, isSubscribed: true };
        persistUser(nextUser);
      }
    }
  };

  const handleRevoke = async (targetEmail: string) => {
    const response = await api.revokeSubscription(targetEmail);

    if (response.success) {
      await loadAdminData();

      if (user.email === targetEmail && !user.isAdmin && !user.isVIP) {
        const nextUser = { ...user, isSubscribed: false };
        persistUser(nextUser);
        if (['dashboard', 'ingestion'].includes(currentPage)) {
          setCurrentPage('subscribe');
        }
      }
    }
  };

  const handleVerifyAdminPin = async (pin: string) => {
    return api.verifyAdmin(pin);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] text-zinc-900 dark:text-white flex flex-col font-sans transition-colors duration-300">
      <Navbar
        onLoginClick={() => setCurrentPage('login')}
        onHomeClick={() => setCurrentPage('home')}
        onLogoutClick={handleLogout}
        onRequestDemoClick={() => setCurrentPage('demo')}
        onDashboardClick={() => setCurrentPage(canAccessWorkspace ? 'dashboard' : 'subscribe')}
        onAdminClick={() => setCurrentPage('admin')}
        onEnterpriseClick={() => setCurrentPage('enterprise')}
        currentPage={currentPage}
        isAuthenticated={user.isAuthenticated}
        canAccessWorkspace={canAccessWorkspace}
        isAdmin={user.isAdmin}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {isMapping && <MappingLoader onComplete={handleMappingComplete} />}

      <main className="flex-grow">
        {currentPage === 'home' && (
          <>
            <HeroSection />

            <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-7xl mx-auto">
              <PricingCalculator />
              <div className="mt-8 sm:mt-12 text-center">
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                  * All plans include secure data encryption and role-based access control.
                </p>
              </div>
            </section>

            <FounderSection />
            <FaqSection />
          </>
        )}

        {currentPage === 'login' && (
          <Login
            onLoginAttempt={handleLoginAttempt}
            onGoogleLoginSuccess={handleGoogleLoginSuccess}
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
          <Unauthorized onSubscribeClick={() => setCurrentPage(user.isAuthenticated ? 'subscribe' : 'login')} />
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
            isVIP={user.isVIP || user.isAdmin}
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
            onVerifyPin={handleVerifyAdminPin}
          />
        )}

        {currentPage === 'enterprise' && <EnterpriseContact />}
        {currentPage === 'demo' && <RequestDemo />}
      </main>

      {(currentPage === 'home' || currentPage === 'enterprise') && (
        <Footer onEnterpriseClick={() => setCurrentPage('enterprise')} />
      )}
    </div>
  );
};

export default App;
