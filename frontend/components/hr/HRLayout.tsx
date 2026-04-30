/**
 * HR Layout — Sidebar + Outlet for all HR pages
 * Updated for Mapping Nexus Command Center UI Specs
 */
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Network, Activity, Zap, FolderKanban, BarChart, Settings, Users, UserCheck, FileText, LogOut, Moon, Sun } from 'lucide-react';
import type { UserProfile } from '../../types';
import BackgroundEffects from '../shared/BackgroundEffects';

interface Props { user: UserProfile; onLogout: () => void; }

const HRLayout: React.FC<Props> = ({ user, onLogout }) => {
    const [isDark, setIsDark] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const navItems = [
        { to: '/hr/dashboard', icon: Network, label: 'NEXUS MAP' },
        { to: '/hr/employees', icon: Users, label: 'EMPLOYEES' },
        { to: '/hr/projects', icon: FolderKanban, label: 'PROJECTS' },
        { to: '/hr/team-requests', icon: UserCheck, label: 'ACTION CENTER' },
        { to: '/hr/burnout', icon: Activity, label: 'BURNOUT RADAR' },
        { to: '/hr/skills', icon: Zap, label: 'SKILL PULSE' },
        { to: '/hr/audit', icon: FileText, label: 'AUDIT LOG' },
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans transition-colors duration-500 relative overflow-hidden bg-background text-foreground">
            <BackgroundEffects />
            
            {/* Top Navigation Bar */}
            <header className="h-16 border-b border-border/50 bg-card/70 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <img src="/logo.svg" alt="Company Logo" className={`w-6 h-6 object-contain ${isDark ? '' : 'invert'}`} />
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold tracking-widest text-sm uppercase">{user.companyName || 'MAPPING NEXUS'}</span>
                        <span className="text-muted-foreground text-[10px] font-mono tracking-widest uppercase">| platform</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-muted-foreground font-mono text-xs">
                    <div className="w-2 h-2 rounded-full bg-nexus-green animate-pulse"></div>
                    <span>APP-LAYER TENANT CONTROLS ACTIVE</span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsDark(!isDark)} 
                        className="p-1.5 border border-border rounded-full text-muted-foreground hover:bg-accent transition-colors"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-sm bg-secondary border border-border flex items-center justify-center text-[10px] font-bold">
                            {user.email ? user.email.substring(0, 2).toUpperCase() : 'PR'}
                        </div>
                        <span className="hidden md:block text-muted-foreground text-xs font-mono uppercase tracking-widest">{user.role}</span>
                    </div>
                    <button onClick={onLogout} title="Logout" className="text-muted-foreground hover:text-destructive transition-colors ml-4 border-l border-border pl-4">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative z-10">
                {/* Left Sidebar */}
                <aside className="w-64 border-r border-border/50 bg-sidebar/50 backdrop-blur-md hidden md:flex flex-col transition-all duration-300">
                    <div className="py-8 flex-1 flex flex-col overflow-y-auto">
                        <div className="px-6 mb-6">
                            <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">[ NAVIGATION ]</span>
                        </div>
                        <nav className="flex flex-col space-y-1 px-4">
                            {navItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2.5 text-xs font-mono uppercase tracking-widest transition-all duration-200 rounded-lg ${
                                            isActive
                                                ? 'bg-accent text-accent-foreground font-bold border border-border shadow-sm'
                                                : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                                        }`
                                    }
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </NavLink>
                            ))}
                            
                            <div className="mt-8 mb-4 px-6 pt-4 border-t border-border/50">
                                <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">[ UPCOMING ]</span>
                            </div>
                            
                            <div className="flex items-center justify-between px-6 py-3 text-sm font-bold text-muted-foreground cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <BarChart className="w-4 h-4" />
                                    BENCHMARKS
                                </div>
                                <span className="text-[10px] font-mono text-info bg-info/10 border border-info/30 px-1.5 rounded">SOON</span>
                            </div>
                            <div className="flex items-center justify-between px-6 py-3 text-sm font-bold text-muted-foreground cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-4 h-4" />
                                    SETTINGS
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* Bottom Section (Tenant) */}
                    <div className="p-4 m-4 border border-border rounded-xl bg-card/40 backdrop-blur-md">
                        <div className="text-muted-foreground font-mono text-xs tracking-widest mb-3">ACTIVE TENANT</div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-background border border-border text-primary flex items-center justify-center font-bold text-xl rounded-lg shadow-sm">
                                {(user.companyName || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm tracking-tight">{user.companyName || 'Company'}</span>
                                <span className="text-nexus-green font-mono text-[10px]">{user.role.toUpperCase()} SESSION</span>
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
};

export default HRLayout;
