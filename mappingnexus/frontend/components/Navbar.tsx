import React from 'react';
import { Logo } from './Logo';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
  onRequestDemoClick?: () => void;
  currentPage: 'home' | 'login' | 'dashboard' | 'signup' | 'ingestion' | 'unauthorized' | 'subscribe' | 'admin' | 'enterprise' | 'demo';
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onHomeClick, onRequestDemoClick, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // If on demo page, render minimal nav
  if (currentPage === 'demo') {
    return (
      <nav className="fixed top-0 left-0 w-full z-50 p-6 pointer-events-none">
        <div 
          className="inline-flex items-center gap-3 cursor-pointer pointer-events-auto bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
          onClick={onHomeClick}
        >
           <Logo className="w-6 h-6" />
           <span className="font-sans font-bold text-xs text-white uppercase tracking-wider">Back to Nexus</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b border-zinc-200 bg-white relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
          onClick={onHomeClick}
        >
          <Logo className="w-8 sm:w-10 h-8 sm:h-10 group-hover:opacity-80 transition-opacity flex-shrink-0" />
          <span className="font-sans font-semibold tracking-wide text-sm sm:text-lg text-nexus-charcoal truncate">
            Mapping Nexus
          </span>
        </div>
        
        {currentPage === 'home' && (
          <>
            {/* Desktop View */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest hidden lg:inline">
                System Status: Nominal
              </span>
              <button 
                onClick={onLoginClick}
                className="text-sm font-medium hover:text-zinc-600 transition-colors"
              >
                Login
              </button>
              <button 
                onClick={onRequestDemoClick}
                className="bg-black text-white px-5 py-2 text-xs font-mono uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              >
                Request Demo
              </button>
            </div>

            {/* Mobile View */}
            <div className="flex md:hidden items-center gap-2">
              <button 
                onClick={onLoginClick}
                className="text-xs font-medium hover:text-zinc-600 transition-colors px-3 py-2"
              >
                Login
              </button>
              <button 
                onClick={onRequestDemoClick}
                className="bg-black text-white px-3 sm:px-4 py-2 text-xs font-mono uppercase tracking-widest hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                Demo
              </button>
            </div>
          </>
        )}

        {currentPage === 'dashboard' && (
           <div className="flex items-center gap-2 sm:gap-4">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 hidden sm:inline">
               Secure Connection
             </span>
             <button 
               onClick={onHomeClick}
               className="text-xs font-mono uppercase text-red-600 hover:text-red-800"
             >
               Disconnect
             </button>
           </div>
        )}
      </div>
    </nav>
  );
};