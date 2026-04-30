import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import BackgroundEffects from './BackgroundEffects';

interface Props {
    children: React.ReactNode;
    hideHeader?: boolean;
}

const PublicLayout: React.FC<Props> = ({ children, hideHeader = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
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
        <div className="min-h-screen flex flex-col relative overflow-x-hidden font-sans transition-colors duration-500 bg-background text-foreground">
            
            {/* --- Background Effects --- */}
            <BackgroundEffects />

            {/* --- Header --- */}
            {!hideHeader ? (
                <header className="relative z-50 flex justify-center pt-8 px-4 flex-shrink-0">
                    <div className="flex items-center justify-between w-full max-w-5xl px-5 py-2.5 bg-card/70 backdrop-blur-xl rounded-full border border-border/60 shadow-sm transition-all duration-300">
                        
                        {/* Logo Area */}
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground opacity-90">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            <span className="font-bold text-[15px] tracking-tight">MappingNexus</span>
                        </div>

                        {/* Navigation Pills */}
                        <div className="hidden sm:flex items-center bg-secondary/60 rounded-full p-1 border border-transparent">
                            <button 
                                onClick={() => navigate('/')} 
                                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${isHome ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Home
                            </button>
                            <button 
                                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${!isHome ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Enterprise
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => setIsDark(!isDark)} 
                                className="p-1.5 border border-border rounded-full text-muted-foreground hover:bg-accent transition-colors"
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                            </button>
                            
                            <button 
                                onClick={() => navigate('/login')} 
                                className="text-sm font-semibold text-muted-foreground hover:text-foreground hidden sm:block py-1.5 px-2 transition-colors"
                            >
                                Log in
                            </button>
                            
                            <button 
                                onClick={() => navigate('/onboard')} 
                                className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold shadow-md hover:scale-105 active:scale-95 transition-transform"
                            >
                                Demo
                            </button>
                        </div>
                    </div>
                </header>
            ) : (
                <div className="absolute top-6 left-6 z-50 flex items-center space-x-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-card/70 backdrop-blur-xl border border-border/60 rounded-full text-sm font-semibold text-foreground hover:bg-accent transition-colors shadow-sm"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span>Back to Home</span>
                    </button>
                    <button 
                        onClick={() => setIsDark(!isDark)} 
                        className="p-2 bg-card/70 backdrop-blur-xl border border-border/60 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                    </button>
                </div>
            )}

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col relative z-10">
                {children}
            </div>
            
        </div>
    );
};

export default PublicLayout;
