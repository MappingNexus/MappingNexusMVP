/**
 * HR Layout — Sidebar + Outlet for all HR pages
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, FileText, FolderKanban, LogOut, Network, UserCheck, Users, Zap, Settings, Moon, Sun } from 'lucide-react';
import type { UserProfile } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
 user: UserProfile;
 onLogout: () => void;
}

const HRLayout: React.FC<Props> = ({ user, onLogout }) => {
 const navItems = [
 { to: '/hr/dashboard', icon: Network, label: 'NEXUS MAP' },
 { to: '/hr/employees', icon: Users, label: 'EMPLOYEES' },
 { to: '/hr/projects', icon: FolderKanban, label: 'PROJECTS' },
 { to: '/hr/team-requests', icon: UserCheck, label: 'ACTION CENTER' },
 { to: '/hr/burnout', icon: Activity, label: 'BURNOUT RADAR' },
 { to: '/hr/skills', icon: Zap, label: 'SKILL PULSE' },
 { to: '/hr/audit', icon: FileText, label: 'AUDIT LOG' },
 { to: '/hr/settings', icon: Settings, label: 'SETTINGS' },
 ];

 const { theme, toggleTheme } = useTheme();

 return (
 <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
 <header className="cb-topnav cb-topnav--light px-6 sticky top-0 z-50">
 <div className="flex items-center gap-4">
 <img src="/logo.svg" alt="Company Logo" className="w-5 h-5 object-contain" />
 <div className="flex items-center gap-3">
 <span className="cb-wordmark">{user.companyName || 'Mapping Nexus'}</span>
 <span className="text-muted-foreground text-xs font-mono">HR</span>
 </div>
 </div>

 <div className="flex items-center gap-6">
 <div className="hidden md:flex items-center gap-2 text-muted-foreground text-xs">
 <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
 <span>Tenant controls active</span>
 </div>
 <button
   onClick={toggleTheme}
   className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
   title="Toggle theme"
 >
   {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
 </button>
 <div className="flex items-center gap-3 pl-6 border-l border-border">
 <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-[11px] font-semibold">
 {user.email ? user.email.substring(0, 2).toUpperCase() : 'HR'}
 </div>
 <span className="hidden md:block text-muted-foreground text-xs font-mono">{user.role}</span>
 </div>
 <button
 onClick={onLogout}
 title="Logout"
 className="text-muted-foreground hover:text-destructive transition-colors ml-2"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </header>

 <div className="flex flex-1 overflow-hidden">
 <aside className="w-64 border-r border-border bg-background hidden md:flex flex-col">
 <div className="py-6 flex-1 flex flex-col overflow-y-auto">
 <div className="px-6 mb-8">
 <p className="cb-caption">Navigation</p>
 </div>
 <nav className="flex flex-col space-y-1 px-3">
 {navItems.map((item) => (
 <NavLink
 key={item.to}
 to={item.to}
 className={({ isActive }) =>
 `flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors rounded-lg ${isActive
 ? 'bg-muted text-foreground'
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
 }`
 }
 >
 <item.icon className="w-4 h-4" />
 <span>{item.label}</span>
 </NavLink>
 ))}
 </nav>
 </div>

 <div className="px-4 py-6 border-t border-border">
 <div className="cb-card p-4">
 <p className="cb-caption mb-3">Active Tenant</p>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-semibold text-sm rounded-lg">
 {(user.companyName || 'C').charAt(0).toUpperCase()}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="font-semibold text-sm text-foreground truncate">{user.companyName || 'Company'}</span>
 <span className="text-muted-foreground text-xs">{user.role}</span>
 </div>
 </div>
 </div>
 </div>
 </aside>

 <main className="flex-1 overflow-y-auto p-6 lg:p-10">
 <Outlet />
 </main>
 </div>
 </div>
 );
};

export default HRLayout;

