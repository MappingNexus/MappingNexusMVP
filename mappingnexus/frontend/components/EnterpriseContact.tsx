import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Shield, Building2, ChevronDown, CheckCircle2, Lock, Search, DollarSign, Handshake } from 'lucide-react';

// Simplified Country Code List for Searchability
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

export const EnterpriseContact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    post: '',
    company: '',
    headcount: '',
    email: '',
    phone: '',
    budget: '',
    isFlexible: false
  });
  
  // Country Selector State
  const [countryCode, setCountryCode] = useState('+1');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Submission State
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Click outside to close dropdown
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
    
    // Simulate Encryption & Transmission
    setTimeout(() => {
      setStatus('success');
    }, 2500);
  };

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold uppercase tracking-tight mb-2 text-center">Inquiry Logged</h2>
        <div className="h-1 w-20 bg-black mb-6"></div>
        <p className="text-zinc-600 max-w-md text-center font-mono text-sm leading-relaxed">
          Protocol secure. Our Enterprise Lead will reach out to <span className="font-bold text-black">{formData.name}</span> shortly to discuss the specific parameters of <span className="font-bold text-black">{formData.company}</span>.
        </p>
        <div className="mt-8 text-xs font-mono text-zinc-400">REF_ID: #NEX-{Math.floor(Math.random() * 10000)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-8">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 mb-4 bg-zinc-100 px-3 py-1 rounded-sm">
          <Building2 className="w-4 h-4 text-black" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Enterprise Division</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Command Protocol Configuration</h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
          For organizations managing 250+ nodes. <br/>
          Dedicated infrastructure. Custom Logic Engines. 24/7 Strategic Support.
        </p>
      </div>

      <div className="max-w-4xl mx-auto bg-white border-2 border-zinc-200 p-8 md:p-12 relative shadow-2xl">
        {/* Decorator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>

        {status === 'submitting' ? (
          <div className="py-20 text-center">
            <Lock className="w-12 h-12 text-black mx-auto mb-6 animate-pulse" />
            <h3 className="text-lg font-mono font-bold uppercase tracking-widest mb-2">Encrypting Data...</h3>
            <p className="text-xs text-zinc-500 mb-8">Sending to Mission Control</p>
            <div className="w-64 mx-auto bg-zinc-100 h-1 overflow-hidden">
              <div className="h-full bg-black animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
            <style>{`
              @keyframes loading {
                0% { width: 0%; transform: translateX(-100%); }
                100% { width: 100%; transform: translateX(100%); }
              }
            `}</style>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              
              {/* Personal Details */}
              <div className="space-y-8">
                <h3 className="text-xs font-bold uppercase text-zinc-400 border-b border-zinc-100 pb-2">01 // Personal Identifier</h3>
                
                <div className="group">
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2 group-focus-within:text-black transition-colors">
                    Name of Applier
                  </label>
                  <input 
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-[#121212] text-white border border-zinc-700 p-4 font-mono text-sm focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. Jonathan Doe"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2 group-focus-within:text-black transition-colors">
                    Post of Applier
                  </label>
                  <input 
                    type="text"
                    name="post"
                    value={formData.post}
                    onChange={handleInputChange}
                    className="w-full bg-[#121212] text-white border border-zinc-700 p-4 font-mono text-sm focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. Chief Operations Officer"
                  />
                </div>
              </div>

              {/* Company Details */}
              <div className="space-y-8">
                <h3 className="text-xs font-bold uppercase text-zinc-400 border-b border-zinc-100 pb-2">02 // Organizational Data</h3>
                
                <div className="group">
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2 group-focus-within:text-black transition-colors">
                    Name of Company
                  </label>
                  <input 
                    type="text"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full bg-[#121212] text-white border border-zinc-700 p-4 font-mono text-sm focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. Nexus Corp Global"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2 group-focus-within:text-black transition-colors">
                    Total Headcount (Nodes)
                  </label>
                  <input 
                    type="number"
                    name="headcount"
                    value={formData.headcount}
                    onChange={handleInputChange}
                    className="w-full bg-[#121212] text-white border border-zinc-700 p-4 font-mono text-sm focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              {/* Communication */}
              <div className="md:col-span-2 space-y-8">
                <h3 className="text-xs font-bold uppercase text-zinc-400 border-b border-zinc-100 pb-2">03 // Communication Uplink</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="group">
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2 group-focus-within:text-black transition-colors">
                      Work Email
                    </label>
                    <input 
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] text-white border border-zinc-700 p-4 font-mono text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="name@company.com"
                    />
                  </div>

                  <div className="group relative" ref={dropdownRef}>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2 group-focus-within:text-black transition-colors">
                      Contact Number
                    </label>
                    <div className="flex">
                      {/* Searchable Country Code Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="h-full bg-[#1A1A1A] text-white border border-r-0 border-zinc-700 px-3 flex items-center gap-2 font-mono text-sm hover:bg-[#252525] transition-colors focus:outline-none min-w-[80px] justify-between"
                        >
                          {countryCode}
                          <ChevronDown className="w-3 h-3 text-zinc-400" />
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-black shadow-xl z-20 max-h-60 overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-zinc-100 bg-zinc-50">
                              <div className="flex items-center gap-2 bg-white border border-zinc-200 px-2 py-1">
                                <Search className="w-3 h-3 text-zinc-400" />
                                <input 
                                  autoFocus
                                  className="w-full text-xs outline-none py-1"
                                  placeholder="Search country..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto">
                              {filteredCountries.map((c) => (
                                <button
                                  key={c.code + c.country}
                                  type="button"
                                  onClick={() => {
                                    setCountryCode(c.code);
                                    setIsDropdownOpen(false);
                                    setSearchQuery('');
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-100 flex justify-between items-center group"
                                >
                                  <span className="text-zinc-600 group-hover:text-black">{c.country}</span>
                                  <span className="font-mono font-bold">{c.code}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <input 
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] text-white border border-zinc-700 p-4 font-mono text-sm focus:outline-none focus:border-white transition-colors"
                        placeholder="Mobile Number"
                      />
                    </div>
                  </div>
                </div>
              </div>

               {/* Budget Section */}
              <div className="md:col-span-2 space-y-8">
                 <h3 className="text-xs font-bold uppercase text-zinc-400 border-b border-zinc-100 pb-2">04 // Fiscal Parameters</h3>
                 
                 <div className="group max-w-md">
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2 group-focus-within:text-black transition-colors">
                      Proposed Monthly Investment (USD)
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 px-4 flex items-center border-r border-zinc-700 bg-[#1A1A1A] z-10">
                        <DollarSign className="w-4 h-4 text-zinc-400" />
                      </div>
                      <input 
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] text-white border border-zinc-700 pl-16 p-4 font-mono text-sm focus:outline-none focus:border-white transition-colors"
                        placeholder="e.g. 2500"
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-zinc-500">
                      Enter your target budget. Our strategists will review your request and optimize the Nexus for your scale.
                    </p>
                 </div>

                 <div className="flex items-start gap-3">
                   <div className="relative flex items-center">
                     <input
                        type="checkbox"
                        id="flexible"
                        checked={formData.isFlexible}
                        onChange={() => setFormData({ ...formData, isFlexible: !formData.isFlexible })}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                     />
                   </div>
                   <label htmlFor="flexible" className="text-xs text-zinc-600 cursor-pointer select-none">
                     We are open to a <span className="font-bold text-black">flexible multi-year agreement</span> for better rates.
                   </label>
                 </div>
              </div>
            </div>

            <div className="text-center pt-6 border-t border-zinc-100">
               <Button type="submit" className="w-full md:w-auto min-w-[300px] text-sm py-5">
                 <span className="flex items-center justify-center gap-2">
                   {formData.budget ? (
                      <>
                        <Handshake className="w-4 h-4" />
                        Send Proposal to Mission Control
                      </>
                   ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Submit Inquiry
                      </>
                   )}
                 </span>
               </Button>
               <p className="mt-4 text-[10px] font-mono text-zinc-400 uppercase">
                 * Data will be encrypted using Enterprise TLS 1.3 Standards.
               </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};