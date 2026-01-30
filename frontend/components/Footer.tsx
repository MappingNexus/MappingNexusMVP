import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FooterProps {
  onEnterpriseClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onEnterpriseClick }) => {
  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200 py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 bg-black p-6 sm:p-10 md:p-12">
          <div className="text-center md:text-left">
            <h4 className="text-white text-base sm:text-lg font-light tracking-wide mb-2">
              Managing 250+ employees?
            </h4>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              Initialize Enterprise Command protocol for custom logic & dedicated infrastructure.
            </p>
          </div>
          
          <button 
            onClick={onEnterpriseClick}
            className="group flex items-center gap-4 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors whitespace-nowrap"
          >
            Contact Enterprise
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="mt-8 sm:mt-16 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-400 font-mono gap-4 sm:gap-0">
          <p>© 2024 MAPPING NEXUS. INTERNAL USE ONLY.</p>
          <div className="flex gap-4 sm:gap-8">
            <a href="#" className="hover:text-black">PRIVACY PROTOCOL</a>
            <a href="#" className="hover:text-black">TERMS OF SERVICE</a>
          </div>
        </div>
      </div>
    </footer>
  );
};