import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onEnterpriseClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onEnterpriseClick }) => {
  return (
    <footer className="w-full bg-[#050505] border-t border-zinc-900 py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Enterprise CTA Section */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-12 backdrop-blur-sm group">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-zinc-800/30 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left max-w-xl">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3 text-zinc-500">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Secure Infrastructure</span>
              </div>
              <h4 className="text-white text-xl sm:text-2xl font-light tracking-wide mb-3">
                Managing 250+ employees?
              </h4>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                Initialize the Enterprise Command protocol for custom logic, dedicated infrastructure, and role-based access control.
              </p>
            </div>

            <button
              onClick={onEnterpriseClick}
              className="group/btn relative flex items-center gap-4 bg-white text-black px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
              <span className="relative z-10">Contact Enterprise</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-600 font-mono gap-6 sm:gap-0 border-t border-zinc-900/50 pt-8">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-900/50 border border-green-800"></span>
            SYSTEM ONLINE  •  © 2024 MAPPING NEXUS
          </p>
          <div className="flex gap-6 sm:gap-10">
            <a href="#" className="hover:text-zinc-400 transition-colors">PRIVACY PROTOCOL</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">TERMS OF SERVICE</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">STATUS</a>
          </div>
        </div>
      </div>
    </footer>
  );
};