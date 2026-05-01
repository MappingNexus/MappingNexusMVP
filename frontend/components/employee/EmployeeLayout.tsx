/**
 * Employee Layout — Sidebar + Outlet
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import type { UserProfile } from '../../types';

interface Props {
 user: UserProfile;
 onLogout: () => void;
}

const EmployeeLayout: React.FC<Props> = ({ user, onLogout }) => {
 return (
 <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
 <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-50">
 <div className="flex items-center gap-3">
 <img src="/logo.svg" alt="Company Logo" className="w-6 h-6 object-contain" />
 <div className="flex items-baseline gap-2">
 <span className="font-semibold tracking-tight text-sm">{user.companyName || 'Mapping Nexus'}</span>
 <span className="text-muted-foreground text-[11px] font-mono tracking-wide uppercase">EMPLOYEE</span>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="hidden md:flex items-center gap-2 text-muted-foreground font-mono text-xs">
 <div className="w-2 h-2 rounded-full bg-success"></div>
 <span>Session active</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold">
 {user.email ? user.email.substring(0, 2).toUpperCase() : 'EM'}
 </div>
 <span className="hidden md:block text-muted-foreground text-xs font-mono uppercase tracking-widest">{user.role}</span>
 </div>
 <button
 onClick={onLogout}
 title="Logout"
 className="text-muted-foreground hover:text-destructive transition-colors ml-2 border-l border-border pl-4"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </header>

 <div className="flex flex-1 overflow-hidden">
 <aside className="w-64 border-r border-border bg-sidebar hidden md:flex flex-col">
 <div className="py-8 flex-1 flex flex-col overflow-y-auto">
 <div className="px-6 mb-6">
 <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">NAVIGATION</span>
 </div>
 <nav className="flex flex-col space-y-1 px-4">
 <NavLink
 to="/employee/profile"
 className={({ isActive }) =>
 `flex items-center gap-3 px-4 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors rounded-lg ${isActive
 ? 'bg-background text-foreground font-bold border border-border'
 : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-background'
 }`
 }
 >
 <User className="w-3.5 h-3.5" />
 MY PROFILE
 </NavLink>
 </nav>
 </div>

 <div className="p-4 m-4 border border-border rounded-2xl bg-background">
 <div className="text-muted-foreground font-mono text-xs tracking-widest mb-3">ACTIVE TENANT</div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-muted border border-border text-primary flex items-center justify-center font-semibold text-lg rounded-2xl">
 {(user.companyName || 'C').charAt(0).toUpperCase()}
 </div>
 <div className="flex flex-col">
 <span className="font-semibold text-sm tracking-tight">{user.companyName || 'Company'}</span>
 <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">{user.role} session</span>
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

