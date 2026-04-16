/**
 * Employee Layout — Sidebar + Outlet
 */
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { User, LogOut, Moon, Sun } from 'lucide-react';
import BackgroundEffects from '../shared/BackgroundEffects';
import type { UserProfile } from '../../types';

interface Props { user: UserProfile; onLogout: () => void; }

const EmployeeLayout: React.FC<Props> = ({ user, onLogout }) => {
    const [isDark, setIsDark] = useState<boolean>(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    return (
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative overflow-hidden ${isDark ? 'bg-[#0a0a0c] text-white selection:bg-[#00FF66]/30' : 'bg-[#FAFAFA] text-gray-900 selection:bg-blue-500/30'}`}>
            <BackgroundEffects />
            
            {/* Top Navigation Bar */}
            <header className="h-16 border-b border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-[#1a1a1c]/70 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <img src="/logo.svg" alt="Company Logo" className={`w-6 h-6 object-contain ${isDark ? '' : 'invert'}`} />
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold tracking-widest text-sm uppercase">{user.companyName || 'MAPPING NEXUS'}</span>
                        <span className="text-gray-500 dark:text-[#8A8A8A] text-[10px] font-mono tracking-widest uppercase">| portal</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-gray-500 dark:text-[#8A8A8A] font-mono text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-[#00FF66] animate-pulse"></div>
                    <span>EMPLOYEE SESSION ACTIVE</span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsDark(!isDark)} 
                        className="p-1.5 border border-gray-200 dark:border-white/15 rounded-full text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-sm bg-gray-100 dark:bg-[#1A1A1A] border border-gray-300 dark:border-[#2A2A2A] flex items-center justify-center text-[10px] font-bold">
                            {user.email ? user.email.substring(0, 2).toUpperCase() : 'EM'}
                        </div>
                        <span className="hidden md:block text-gray-500 dark:text-[#8A8A8A] text-xs font-mono uppercase tracking-widest">{user.role}</span>
                    </div>
                    <button onClick={onLogout} title="Logout" className="text-gray-500 dark:text-[#8A8A8A] hover:text-red-500 dark:hover:text-[#FF3333] transition-colors ml-4 border-l border-gray-300 dark:border-[#2A2A2A] pl-4">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

        <div className="flex flex-1 overflow-hidden relative z-10">
            {/* Left Sidebar */}
            <aside className="w-64 border-r border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-[#1a1a1c]/50 backdrop-blur-md hidden md:flex flex-col transition-all duration-300">
                <div className="py-8 flex-1 flex flex-col overflow-y-auto">
                    <div className="px-6 mb-6">
                        <span className="text-gray-400 dark:text-[#8A8A8A] font-mono text-[10px] tracking-widest uppercase">[ NAVIGATION ]</span>
                    </div>
                    <nav className="flex flex-col space-y-1 px-4">
                        <NavLink to="/employee/profile"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 text-xs font-mono uppercase tracking-widest transition-all duration-200 rounded-lg ${
                                    isActive
                                        ? 'bg-blue-50/80 dark:bg-white/10 text-blue-600 dark:text-white font-bold border border-blue-200 dark:border-white/20 shadow-sm'
                                        : 'border border-transparent text-gray-500 dark:text-[#8A8A8A] hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-[#1A1A1A]/50'
                                }`
                            }>
                            <User className="w-3.5 h-3.5" />
                            MY PROFILE
                        </NavLink>
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="p-4 m-4 border border-gray-200/50 dark:border-[#2A2A2A] rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-md">
                    <div className="text-gray-500 dark:text-[#8A8A8A] font-mono text-xs tracking-widest mb-3">ACTIVE TENANT</div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-blue-500 dark:text-[#9D4EDD] flex items-center justify-center font-bold text-xl rounded-lg shadow-sm">
                            {(user.companyName || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{user.companyName || 'Company'}</span>
                            <span className="text-blue-500 dark:text-[#00FF66] font-mono text-[10px]">{user.role.toUpperCase()} SESSION</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
                <Outlet />
            </main>
        </div>
    </div>
);
}

export default EmployeeLayout;
