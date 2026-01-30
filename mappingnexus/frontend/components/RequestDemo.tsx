import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { ChevronDown, Search, ArrowRight, CheckCircle2, Loader2, Building2, Users, Mail, Phone, DollarSign } from 'lucide-react';

// Reusing Country Codes
const COUNTRY_CODES = [
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'India' },
  { code: '+61', country: 'Australia' },
  { code: '+81', country: 'Japan' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+86', country: 'China' },
  { code: '+971', country: 'UAE' },
  { code: '+65', country: 'Singapore' },
  { code: '+41', country: 'Switzerland' },
];

export const RequestDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    post: '',
    company: '',
    employees: '',
    email: '',
    phone: '',
    budget: ''
  });
  
  const [countryCode, setCountryCode] = useState('+1');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    return COUNTRY_CODES.filter(c => 
      c.country.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code.includes(searchQuery)
    );
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setStatus('submitting');
    setTimeout(() => setStatus('success'), 2000);
  };

  // Glassmorphism Input Class
  const inputClass = `
    w-full h-10 sm:h-12 md:h-14 bg-[#1A1A1A]/50 backdrop-blur-md border border-white/10 
    px-3 sm:px-4 font-mono text-xs sm:text-sm text-white placeholder-zinc-600 
    focus:outline-none focus:border-white focus:bg-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)] 
    transition-all duration-300 rounded-none appearance-none
  `;

  const labelClass = "block text-[10px] font-mono uppercase text-zinc-500 mb-2 tracking-widest";

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-700">
        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 sm:mb-8 backdrop-blur-lg border border-white/20">
          <CheckCircle2 className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter mb-3 sm:mb-4">REQUEST SECURED</h2>
        <p className="text-zinc-400 max-w-md font-mono text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
          Your transmission has been logged in the Nexus. A tactical strategist will contact <span className="text-white">{formData.email}</span> within 2 hours.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="text-xs font-mono text-white underline decoration-zinc-700 underline-offset-4 hover:decoration-white transition-all"
        >
          Return to Command
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[100px]"></div>
      </div>

      {/* --- LEFT SECTION: MISSION STATEMENT --- */}
      <div className="lg:w-[60%] w-full p-4 sm:p-8 md:p-16 lg:p-24 flex flex-col justify-between relative z-10 lg:h-screen lg:sticky lg:top-0">
        <div className="hidden lg:block">
          <Logo className="w-12 h-12 opacity-80" />
        </div>

        <div className="mt-8 sm:mt-12 lg:mt-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/10 rounded-full mb-6 sm:mb-8 backdrop-blur-md">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-mono uppercase text-white tracking-widest">Live Demo Available</span>
          </div>

          <h1 className="font-sans font-bold text-white leading-[0.9] tracking-tighter" style={{ fontSize: 'clamp(1.75rem, 5vw, 6rem)' }}>
            <span className="block text-zinc-400 font-medium mb-2 lg:mb-4" style={{ fontSize: '0.5em' }}>DONT JUST HIRE,</span>
            UTILIZE YOUR<br/>WORKFORCE.
          </h1>
          
          <p className="mt-6 sm:mt-8 text-zinc-400 text-sm md:text-lg font-light max-w-xl leading-relaxed hidden md:block">
            Experience the precision of the Mapping Nexus. See how we transform your existing headcount into an optimized tactical force.
          </p>
        </div>

        <div className="hidden lg:block">
          <p className="text-[10px] font-mono text-zinc-600 uppercase">
            // Secure Transmission Protocol v2.4
          </p>
        </div>
      </div>

      {/* --- RIGHT SECTION: FORM --- */}
      <div className="lg:w-[40%] w-full bg-[#121212] lg:min-h-screen border-l border-white/5 relative z-20 flex flex-col">
        <div className="flex-grow p-4 sm:p-6 md:p-12 lg:p-16">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl text-white font-bold mb-6 sm:mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-white"></span>
              CONFIGURE DEMO
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8 pb-24 md:pb-0">
              
              {/* Row 1: Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className={labelClass}>Name of Applier</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className={inputClass} 
                    required 
                    placeholder="John Doe" 
                  />
                </div>
                <div>
                  <label className={labelClass}>Post of Applier</label>
                  <input 
                    name="post" 
                    value={formData.post} 
                    onChange={handleInputChange} 
                    className={inputClass} 
                    placeholder="CTO" 
                  />
                </div>
              </div>

              {/* Row 2: Organization */}
              <div>
                <label className={labelClass}>Company Identity</label>
                <div className="relative">
                  <Building2 className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    name="company" 
                    value={formData.company} 
                    onChange={handleInputChange} 
                    className={`${inputClass} pl-10 sm:pl-12`} 
                    required 
                    placeholder="Nexus Corp" 
                  />
                </div>
              </div>

              {/* Row 3: Scale */}
              <div>
                <label className={labelClass}>Node Count (Employees)</label>
                <div className="relative">
                  <Users className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="number"
                    name="employees" 
                    value={formData.employees} 
                    onChange={handleInputChange} 
                    className={`${inputClass} pl-10 sm:pl-12`} 
                    placeholder="e.g. 500" 
                  />
                </div>
              </div>

              {/* Row 4: Contact */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className={labelClass}>Uplink Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="email"
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className={`${inputClass} pl-10 sm:pl-12`} 
                      required 
                      placeholder="name@company.com" 
                    />
                  </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <label className={labelClass}>Secure Line</label>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="h-10 sm:h-12 md:h-14 bg-[#1A1A1A]/50 border border-white/10 border-r-0 px-2 sm:px-3 flex items-center gap-2 font-mono text-xs sm:text-sm text-white hover:bg-white/10 transition-colors min-w-[70px] sm:min-w-[80px] justify-between"
                    >
                      {countryCode}
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                    </button>
                    <input 
                      type="tel"
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      className={inputClass} 
                      placeholder="Mobile Number" 
                    />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 sm:w-64 bg-[#121212] border border-white/20 shadow-2xl z-50 max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-white/10">
                        <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-2 py-1">
                          <Search className="w-3 h-3 text-zinc-500" />
                          <input 
                            autoFocus
                            className="w-full text-xs outline-none bg-transparent text-white py-1 font-mono"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar">
                        {filteredCountries.map((c) => (
                          <button
                            key={c.code + c.country}
                            type="button"
                            onClick={() => {
                              setCountryCode(c.code);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs hover:bg-white/5 flex justify-between items-center text-zinc-300 hover:text-white transition-colors"
                          >
                            <span>{c.country}</span>
                            <span className="font-mono font-bold text-[10px] sm:text-xs">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: Budget */}
              <div>
                <label className={labelClass}>Mission Budget (Monthly USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="number"
                    name="budget" 
                    value={formData.budget} 
                    onChange={handleInputChange} 
                    className={`${inputClass} pl-10 sm:pl-12`} 
                    placeholder="e.g. 2500" 
                  />
                </div>
              </div>

              {/* Desktop Submit Button */}
              <div className="hidden md:block pt-6 sm:pt-8">
                <button 
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-white text-black font-mono text-xs uppercase tracking-[0.2em] font-bold h-12 md:h-14 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-4 group disabled:opacity-50"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      Initialize Demo
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mobile Sticky Button */}
        <div className="md:hidden fixed bottom-0 left-0 w-full p-3 bg-[#121212]/90 backdrop-blur-xl border-t border-white/10 z-50">
          <button 
            onClick={handleSubmit}
            disabled={status === 'submitting'}
            className="w-full bg-white text-black font-mono text-xs uppercase tracking-[0.2em] font-bold h-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
             {status === 'submitting' ? 'Encrypting...' : 'Initialize Demo'}
          </button>
        </div>
      </div>
    </div>
  );
};