import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import BackgroundEffects from './BackgroundEffects';

interface Props {
    children: React.ReactNode;
}

const PublicLayout: React.FC<Props> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Theme state
    const [isDark, setIsDark] = useState<boolean>(false);
    
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);



    const isHome = location.pathname === '/';

    return (
        <div className={`min-h-screen flex flex-col relative overflow-x-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#FAFAFA] text-gray-900'}`}>
            
            {/* --- Background Effects --- */}
            <BackgroundEffects />

            {/* --- Header --- */}
            <header className="relative z-50 flex justify-center pt-8 px-4 flex-shrink-0">
                <div className="flex items-center justify-between w-full max-w-5xl px-5 py-2.5 bg-white/70 dark:bg-[#1a1a1c]/70 backdrop-blur-xl rounded-full border border-gray-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
                    
                    {/* Logo Area */}
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black dark:text-white opacity-90">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        <span className="font-bold text-[15px] tracking-tight">MappingNexus</span>
                    </div>

                    {/* Navigation Pills */}
                    <div className="hidden sm:flex items-center bg-gray-100/60 dark:bg-white/5 rounded-full p-1 border border-transparent dark:border-white/5">
                        <button 
                            onClick={() => navigate('/')} 
                            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${isHome ? 'bg-[#111] dark:bg-white text-white dark:text-black shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Home
                        </button>
                        <button 
                            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${!isHome ? 'bg-[#111] dark:bg-white text-white dark:text-black shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Enterprise
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setIsDark(!isDark)} 
                            className="p-1.5 border border-gray-200 dark:border-white/15 rounded-full text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                        </button>
                        
                        <button 
                            onClick={() => navigate('/login')} 
                            className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hidden sm:block py-1.5 px-2 transition-colors"
                        >
                            Log in
                        </button>
                        
                        <button 
                            onClick={() => navigate('/onboard')} 
                            className="px-5 py-2 bg-[#0A0A0A] dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-semibold shadow-md hover:scale-105 active:scale-95 transition-transform"
                        >
                            Demo
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col relative z-10">
                {children}
            </div>
            
        </div>
    );
};

export default PublicLayout;
