import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import PublicLayout from '../shared/PublicLayout';

const LandingPage: React.FC = () => {
 const navigate = useNavigate();

 return (
 <PublicLayout navVariant="dark">
 {/* Hero Band (Dark) */}
 <section className="w-full" style={{ backgroundColor: 'hsl(var(--surface-dark))', color: 'hsl(var(--on-dark))' }}>
 <div className="cb-container">
 <div className="py-20 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
 <div className="flex flex-col items-start">
 <div className="inline-flex items-center rounded-full px-4 py-2 mb-10" style={{ backgroundColor: 'hsl(var(--surface-dark-elevated))' }}>
 <span className="cb-caption" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 INSTITUTIONAL • TRUSTED • SECURE
 </span>
 </div>

 <h1 className="font-normal tracking-[-0.04em] leading-[1.0] text-[clamp(40px,6vw,80px)]">
 Calm workforce intelligence,
 <br />
 built for operators.
 </h1>

 <p className="mt-8 text-base md:text-lg leading-relaxed max-w-xl" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 Mapping Nexus turns messy people data into a clear system view — so HR, managers, and employees can align on skills,
 projects, and capacity without dashboard noise.
 </p>

 <div className="mt-10 flex flex-col sm:flex-row gap-3">
 <button onClick={() => navigate('/onboard')} className="cb-btn-cta">
 Get started <ArrowRight className="h-4 w-4" />
 </button>
 <button onClick={() => navigate('/login')} className="cb-btn-outline-on-dark">
 Sign in
 </button>
 </div>
 </div>

 {/* Layered product-UI mockup cards */}
 <div className="relative h-[420px] sm:h-[460px] lg:h-[520px] flex items-center justify-center">
 <div
 className="absolute w-full max-w-[520px] rounded-3xl border border-white/10 p-8"
 style={{ backgroundColor: 'hsl(var(--surface-dark-elevated))', transform: 'rotate(-5deg) translateY(18px)' }}
 >
 <div className="flex items-center justify-between mb-8">
 <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 Capacity
 </div>
 <div className="text-xs font-mono" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 Q2 • Live
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="rounded-2xl border border-white/10 p-4">
 <div className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 Utilization
 </div>
 <div className="text-2xl font-mono text-white">92%</div>
 </div>
 <div className="rounded-2xl border border-white/10 p-4">
 <div className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 Open roles
 </div>
 <div className="text-2xl font-mono text-white">18</div>
 </div>
 <div className="rounded-2xl border border-white/10 p-4">
 <div className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 Skills
 </div>
 <div className="text-2xl font-mono text-white">1.3k</div>
 </div>
 </div>
 </div>

 <div
 className="absolute w-full max-w-[520px] rounded-3xl border border-white/10 p-8"
 style={{ backgroundColor: 'hsl(var(--surface-dark-elevated))', transform: 'rotate(3deg) translateY(-14px) translateX(10px)' }}
 >
 <div className="flex items-center justify-between mb-8">
 <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 Skill pulse
 </div>
 <div className="text-xs font-mono" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 30d
 </div>
 </div>
 <div className="space-y-3">
 {[
 { label: 'Data analysis', value: 78 },
 { label: 'Frontend', value: 61 },
 { label: 'Ops automation', value: 54 },
 ].map((row) => (
 <div key={row.label} className="flex items-center gap-4">
 <div className="w-36 text-sm text-white/90">{row.label}</div>
 <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
 <div className="h-full" style={{ width: `${row.value}%`, backgroundColor: 'hsl(var(--primary))' }} />
 </div>
 <div className="w-10 text-right text-sm font-mono text-white">{row.value}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Features (Light) */}
 <section className="w-full bg-background">
 <div className="cb-container py-20 md:py-24">
 <div className="max-w-2xl">
 <div className="cb-caption mb-4">WHY MAPPING NEXUS</div>
 <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.02em] leading-tight">
 A clean system layer for people data.
 </h2>
 <p className="mt-4 cb-body text-base md:text-lg leading-relaxed">
 Built to feel like a financial-services brand: quiet confidence, clear hierarchy, and precise surface decisions.
 </p>
 </div>

 <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
 {[
 {
 title: 'Role-based clarity',
 body: 'HR, managers, and employees see the same truth — shaped to their workflows.',
 },
 {
 title: 'Hairline precision',
 body: 'Minimal elevation, card-on-card layering, and clean dividers — never decorative shadows.',
 },
 {
 title: 'Scarce blue usage',
 body: 'One action color: Coinbase Blue-style primary for CTAs and a few inline accents.',
 },
 ].map((card) => (
 <div key={card.title} className="cb-feature-card">
 <h3 className="text-lg font-semibold tracking-tight">{card.title}</h3>
 <p className="mt-3 cb-body leading-relaxed">{card.body}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA Band (Dark) */}
 <section className="w-full" style={{ backgroundColor: 'hsl(var(--surface-dark))', color: 'hsl(var(--on-dark))' }}>
 <div className="cb-container py-20 md:py-24 text-center">
 <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.02em] leading-tight">
 Take control of your workforce map.
 </h2>
 <p className="mt-4 text-base md:text-lg leading-relaxed mx-auto max-w-2xl" style={{ color: 'hsl(var(--on-dark-soft))' }}>
 Provision a workspace in minutes, then connect projects, people, and skills into a single operating picture.
 </p>
 <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
 <button onClick={() => navigate('/onboard')} className="cb-btn-cta">
 Create workspace <ArrowRight className="h-4 w-4" />
 </button>
 <button onClick={() => navigate('/login')} className="cb-btn-outline-on-dark">
 Sign in
 </button>
 </div>
 </div>
 </section>

 {/* Footer (Light) */}
 <footer className="w-full bg-background border-t border-border">
 <div className="cb-container py-16">
 <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
 <div className="lg:col-span-2">
 <div className="cb-wordmark mb-3">
 <span className="cb-wordmark-accent">Mapping</span>Nexus
 </div>
 <p className="cb-body text-sm leading-relaxed max-w-sm">
 Institutional-grade workforce mapping for teams that want calm surfaces and clear decisions.
 </p>
 </div>
 {[
 { title: 'Product', links: ['Overview', 'Security', 'Integrations'] },
 { title: 'Teams', links: ['HR', 'Managers', 'Employees'] },
 { title: 'Company', links: ['About', 'Careers', 'Contact'] },
 { title: 'Legal', links: ['Privacy', 'Terms', 'Status'] },
 ].map((col) => (
 <div key={col.title}>
 <div className="text-sm font-semibold text-foreground mb-4">{col.title}</div>
 <ul className="space-y-2">
 {col.links.map((l) => (
 <li key={l}>
 <a className="text-sm cb-body hover:text-foreground transition-colors" href="#">
 {l}
 </a>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>

 <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="text-xs cb-body">© {new Date().getFullYear()} Mapping Nexus. All rights reserved.</div>
 <div className="flex items-center gap-2 text-xs cb-body">
 <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
 Operational surfaces optimized for clarity.
 </div>
 </div>
 </div>
 </footer>
 </PublicLayout>
 );
};

export default LandingPage;
