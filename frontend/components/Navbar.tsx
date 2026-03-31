import React from 'react';
import { Logo } from './Logo';
import { Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
  onLogoutClick?: () => void;
  onRequestDemoClick?: () => void;
  onDashboardClick?: () => void;
  onAdminClick?: () => void;
  onEnterpriseClick?: () => void;
  currentPage: 'home' | 'login' | 'dashboard' | 'signup' | 'ingestion' | 'unauthorized' | 'subscribe' | 'admin' | 'enterprise' | 'demo';
  isAuthenticated: boolean;
  canAccessWorkspace: boolean;
  isAdmin: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
  onHomeClick,
  onLogoutClick,
  onRequestDemoClick,
  onDashboardClick,
  onAdminClick,
  onEnterpriseClick,
  currentPage,
  isAuthenticated,
  canAccessWorkspace,
  isAdmin,
  isDarkMode,
  toggleTheme,
}) => {
  if (currentPage === 'demo') {
    return (
      <nav className="fixed top-0 left-0 w-full z-50 p-6 pointer-events-none">
        <div
          className="inline-flex items-center gap-3 cursor-pointer pointer-events-auto bg-zinc-900/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/5 shadow-2xl hover:bg-zinc-800 transition-colors"
          onClick={onHomeClick}
        >
          <Logo className="w-5 h-5 text-white" />
          <span className="font-medium text-xs text-zinc-300">Back to Nexus</span>
        </div>
      </nav>
    );
  }

  const navButtonClass = (active: boolean) =>
    `px-3 py-2 text-sm rounded-full transition-colors ${active
      ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
    }`;

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 transition-all duration-300">
      <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-full shadow-2xl shadow-black/5 dark:shadow-black/50 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent pointer-events-none -translate-x-full animate-[shimmer_8s_infinite]"></div>

        <div
          className="flex items-center gap-3 cursor-pointer group relative z-10 shrink-0"
          onClick={onHomeClick}
        >
          <div className="text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
            <Logo className="w-6 h-6" />
          </div>
          <span className="font-bold tracking-tight text-lg text-zinc-900 dark:text-white transition-colors duration-300 hidden sm:block">
            MappingNexus
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 relative z-10">
          <button onClick={onHomeClick} className={navButtonClass(currentPage === 'home')}>
            Home
          </button>
          <button onClick={onEnterpriseClick} className={navButtonClass(currentPage === 'enterprise')}>
            Enterprise
          </button>
          {isAuthenticated && canAccessWorkspace && (
            <button
              onClick={onDashboardClick}
              className={navButtonClass(currentPage === 'dashboard' || currentPage === 'ingestion' || currentPage === 'subscribe')}
            >
              Workspace
            </button>
          )}
          {isAuthenticated && isAdmin && (
            <button onClick={onAdminClick} className={navButtonClass(currentPage === 'admin')}>
              Admin
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <button
              onClick={onLogoutClick}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Log in
              </button>
              <button
                onClick={onRequestDemoClick}
                className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg"
              >
                Demo
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
