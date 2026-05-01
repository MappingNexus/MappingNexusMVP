/**
 * Employee Layout — Sidebar + Outlet
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, User, Settings, Moon, Sun } from 'lucide-react';
import type { UserProfile } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
 user: UserProfile;
 onLogout: () => void;
}

const EmployeeLayout: React.FC<Props> = ({ user, onLogout }) => {
 const { theme, toggleTheme } = useTheme();
 return (
 <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
 <header className="cb-topnav cb-topnav--light px-6 sticky top-0 z-50">
 <div className="flex items-center gap-4">
 <img src="/logo.svg" alt="Company Logo" className="w-5 h-5 object-contain" />
 <div className="flex items-center gap-3">
 <span className="cb-wordmark">{user.companyName || 'Mapping Nexus'}</span>
 <span className="text-muted-foreground text-xs font-mono">EMPLOYEE</span>
 </div>
 </div>

 <div className="flex items-center gap-6">
 <div className="hidden md:flex items-center gap-2 text-muted-foreground text-xs">
 <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
 <span>Session active</span>
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
 {user.email ? user.email.substring(0, 2).toUpperCase() : 'EM'}
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
 <NavLink
 to="/employee/profile"
 className={({ isActive }) =>
 `flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors rounded-lg ${isActive
 ? 'bg-muted text-foreground'
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
 }`
 }
 >
 <User className="w-4 h-4" />
 <span>Profile</span>
 </NavLink>
 <NavLink
 to="/employee/settings"
 className={({ isActive }) =>
 `flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors rounded-lg ${isActive
 ? 'bg-muted text-foreground'
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
 }`
 }
 >
 <Settings className="w-4 h-4" />
 <span>Settings</span>
 </NavLink>
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

export default EmployeeLayout;

