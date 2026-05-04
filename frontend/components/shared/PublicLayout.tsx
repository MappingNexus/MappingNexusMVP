import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, Menu, Search, X } from 'lucide-react';

interface Props {
 children: React.ReactNode;
 hideHeader?: boolean;
 navVariant?: 'light' | 'dark';
}

const PublicLayout: React.FC<Props> = ({ children, hideHeader = false, navVariant = 'light' }) => {
 const navigate = useNavigate();
 const location = useLocation();

 const [menuOpen, setMenuOpen] = useState(false);

 const isHome = location.pathname === '/';

 useEffect(() => {
 if (!menuOpen) return;
 const onKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') setMenuOpen(false);
 };
 window.addEventListener('keydown', onKeyDown);
 return () => window.removeEventListener('keydown', onKeyDown);
 }, [menuOpen]);

 const navItems = [
 { label: 'Product', to: '/' },
 { label: 'Enterprise', to: '/' },
 { label: 'Developers', to: '/' },
 { label: 'Company', to: '/' },
 ];

 return (
 <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
 {!hideHeader && (
 <header className={`sticky top-0 z-50 w-full ${navVariant === 'dark' ? 'cb-topnav--dark' : 'cb-topnav--light'}`}>
 <div className="cb-container">
 <div className="cb-topnav">
 <button
 type="button"
 onClick={() => navigate('/')}
 className="flex items-center gap-2"
 aria-label="Go to home"
 >
 <span className="cb-wordmark">
 <span className="cb-wordmark-accent">Mapping</span>Nexus
 </span>
 </button>

 <nav className="hidden md:flex items-center gap-6">
 {navItems.map((item) => (
 <Link key={item.label} to={item.to} className="cb-navlink">
 {item.label}
 </Link>
 ))}
 </nav>

 <div className="flex items-center gap-2">
 <button
 type="button"
 className="hidden sm:inline-flex items-center justify-center h-11 w-11 rounded-full border border-border/80 bg-transparent"
 aria-label="Search"
 >
 <Search className="h-4 w-4" />
 </button>
 <button
 type="button"
 className="hidden sm:inline-flex items-center justify-center h-11 w-11 rounded-full border border-border/80 bg-transparent"
 aria-label="Region"
 >
 <Globe className="h-4 w-4" />
 </button>

 <button
 onClick={() => navigate('/login')}
 className={`hidden sm:inline-flex items-center justify-center h-11 px-4 rounded-full text-sm font-semibold transition-colors ${navVariant === 'dark' ? 'text-white/80 hover:text-white' : 'text-foreground/80 hover:text-foreground'}`}
 >
 Sign in
 </button>

 <button
 onClick={() => navigate('/onboard')}
 className={navVariant === 'dark' ? 'cb-btn-secondary-dark' : 'cb-btn-primary'}
 >
 Get started
 </button>

 <button
 type="button"
 className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-full border border-border/80 bg-transparent"
 onClick={() => setMenuOpen(true)}
 aria-label="Open menu"
 >
 <Menu className="h-5 w-5" />
 </button>
 </div>
 </div>
 </div>
 </header>
 )}

 {hideHeader && (
 <div className="cb-container pt-4">
 <div className="flex items-center justify-between ">
 <button type="button"
  onClick={() => navigate('/')} className="cb-btn-secondary" aria-label="Go to home">
 Home
 </button>

 </div>
 </div>
 )}

 {menuOpen && (
 <div className="fixed inset-0 z-[60]">
 <button
 type="button"
 className="absolute inset-0 bg-black/40"
 aria-label="Close menu"
 onClick={() => setMenuOpen(false)}
 />
 <div className="absolute right-0 top-0 h-full w-[320px] bg-background border-l border-border p-6">
 <div className="flex items-center justify-between mb-6">
 <span className="cb-wordmark">
 <span className="cb-wordmark-accent">Mapping</span>Nexus
 </span>
 <button
 type="button"
 className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-border bg-transparent"
 aria-label="Close menu"
 onClick={() => setMenuOpen(false)}
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 <div className="flex flex-col gap-3">
 {navItems.map((item) => (
 <Link
 key={item.label}
 to={item.to}
 className="text-base font-semibold text-foreground/90 hover:text-foreground transition-colors"
 onClick={() => setMenuOpen(false)}
 >
 {item.label}
 </Link>
 ))}
 </div>
 <div className="mt-8 flex flex-col gap-3">
 <button onClick={() => navigate('/login')} className="cb-btn-secondary">
 Sign in
 </button>
 <button onClick={() => navigate('/onboard')} className="cb-btn-primary">
 Get started
 </button>
 </div>
 </div>
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
