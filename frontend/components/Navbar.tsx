import React from 'react';
import { Logo } from './Logo';
import { Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
  onLogoutClick?: () => void;
  onRequestDemoClick?: () => void;
  currentPage: 'home' | 'login' | 'dashboard' | 'signup' | 'ingestion' | 'unauthorized' | 'subscribe' | 'admin' | 'enterprise' | 'demo';
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onHomeClick, onLogoutClick, onRequestDemoClick, currentPage, isDarkMode, toggleTheme }) => {

  // If on demo page, render minimal nav
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

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 transition-all duration-300">
      <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-full shadow-2xl shadow-black/5 dark:shadow-black/50 px-6 sm:px-8 h-16 flex items-center justify-between relative overflow-hidden transition-colors duration-300">

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent pointer-events-none -translate-x-full animate-[shimmer_8s_infinite]"></div>

        <div
          className="flex items-center gap-3 cursor-pointer group relative z-10"
          onClick={onHomeClick}
        >
          <div className="text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
            <Logo className="w-6 h-6" />
          </div>
          <span className="font-bold tracking-tight text-lg text-zinc-900 dark:text-white transition-colors duration-300">
            MappingNexus
          </span>
        </div>

        {currentPage === 'home' && (
          <>
            {/* Desktop View */}
            <div className="hidden md:flex items-center gap-2 relative z-10">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all mr-2"
                aria-label="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={onLoginClick}
                className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Log in
              </button>
              <button
                onClick={onRequestDemoClick}
                className="bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-2 text-sm font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg"
              >
                Request Demo
              </button>
            </div>

            {/* Mobile View */}
            <div className="flex md:hidden items-center gap-2 relative z-10">
              <button
                onClick={onLoginClick}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3"
              >
                Login
              </button>
              <button
                onClick={onRequestDemoClick}
                className="bg-white text-black px-4 py-2 text-sm font-semibold rounded-full hover:bg-zinc-200 transition-colors"
              >
                Demo
              </button>
            </div>
          </>
        )}

        {currentPage === 'dashboard' && (
          <div className="flex items-center gap-4 relative z-10">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-green-400">
                Secure
              </span>
            </div>
            <button
              onClick={onLogoutClick}
              className="text-xs font-medium text-zinc-500 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};