import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Search, BrainCircuit, Globe, Plane, UserCheck, Users, Menu, X, ChevronRight, Crown, Target, Clock, Zap, Shield, DollarSign, Plus, X as XIcon, Star, Sparkles, Upload, FileText, Scan } from 'lucide-react';
import { Employee } from '../types';

interface DashboardProps {
  employees: Employee[];
  isVIP: boolean;
  onAddEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

interface SkillTag {
  name: string;
  priority: 'Essential' | 'Preferred';
}

export const Dashboard: React.FC<DashboardProps> = ({ employees, isVIP, onAddEmployee, onDeleteEmployee }) => {
  const [brief, setBrief] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [processingStep, setProcessingStep] = useState('');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);

  // Tactical Parameters
  const [tacticalParams, setTacticalParams] = useState({
    location: 'Anywhere',
    duration: 'Medium Term',
    urgency: 'Standard',
    clearance: 'Senior Expert',
    budget: 'Best Fit'
  });

  // Skills Engine
  const [requiredSkills, setRequiredSkills] = useState<SkillTag[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // AI Suggestion Logic
  useEffect(() => {
    if (!brief) {
      setAiSuggestions([]);
      return;
    }
    const suggestions: string[] = [];
    const text = brief.toLowerCase();
    
    // Mock NLP Analysis
    if (text.includes('japan') || text.includes('tokyo')) suggestions.push('Japanese Language');
    if (text.includes('lead') || text.includes('manage')) suggestions.push('Leadership');
    if (text.includes('negotiat')) suggestions.push('Negotiation');
    if (text.includes('data') || text.includes('ai')) suggestions.push('Data Science');
    if (text.includes('pharma')) suggestions.push('Pharma Domain');
    if (text.includes('sales')) suggestions.push('Enterprise Sales');
    if (text.includes('urgent') || text.includes('crisis')) suggestions.push('Crisis Mgmt');

    // Filter out already added skills
    setAiSuggestions(suggestions.filter(s => !requiredSkills.some(rs => rs.name === s)));
  }, [brief, requiredSkills]);

  const handleAddSkill = (name: string) => {
    if (requiredSkills.some(s => s.name === name)) return;
    setRequiredSkills([...requiredSkills, { name, priority: 'Preferred' }]);
    setSkillInput('');
  };

  const toggleSkillPriority = (name: string) => {
    setRequiredSkills(prev => prev.map(s => 
      s.name === name ? { ...s, priority: s.priority === 'Essential' ? 'Preferred' : 'Essential' } : s
    ));
  };

  const removeSkill = (name: string) => {
    setRequiredSkills(prev => prev.filter(s => s.name !== name));
  };

  const handleBriefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.trim()) return;
    
    setIsProcessing(true);
    setShowResults(false);
    
    // Dynamic Processing Sequence
    const sequence = [
      `Parsing Mission: ${tacticalParams.urgency} Priority...`,
      `Filtering for ${tacticalParams.clearance} clearance...`,
      `Calculating logistics for ${tacticalParams.location}...`,
      `Optimizing for ${tacticalParams.budget} strategy...`,
      requiredSkills.some(s => s.priority === 'Essential') 
        ? `Locking ESSENTIAL constraints: ${requiredSkills.filter(s => s.priority === 'Essential').map(s => s.name).join(', ')}...` 
        : 'Scanning skill adjacency...',
      'Synthesizing matches...'
    ];

    let stepIndex = 0;
    setProcessingStep(sequence[0]);

    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < sequence.length) {
        setProcessingStep(sequence[stepIndex]);
      }
    }, 600);
    
    setTimeout(() => {
      clearInterval(interval);
      setIsProcessing(false);
      setShowResults(true);
    }, 3600);
  };

  // Helper for rendering segmented controls
  const ControlGroup = ({ label, options, current, onChange, icon: Icon }: any) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-zinc-500">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {options.map((opt: string) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`
              text-xs font-mono py-2 px-3 border transition-all duration-200 text-left relative overflow-hidden group
              ${current === opt 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}
            `}
          >
            {current === opt && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] bg-white overflow-hidden">
      
      {/* Sidebar: Network Nodes */}
      <aside 
        className={`
          fixed md:relative z-20 h-full md:h-auto bg-zinc-50 border-r border-zinc-200 transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'w-full sm:w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden opacity-0 md:opacity-100'}
        `}
      >
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Network Nodes</h3>
            <p className="text-[10px] font-mono text-zinc-400">{employees.length} Active Agents</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-2">
           {employees.length === 0 ? (
             <div className="text-center py-8 text-xs text-zinc-400 italic">No nodes found.</div>
           ) : (
             employees.map(emp => (
               <div key={emp.id} className="bg-white border border-zinc-100 p-3 hover:border-black transition-colors group cursor-pointer relative">
                 <div className="flex justify-between items-start mb-1">
                   <span className="font-medium text-sm text-zinc-800">{emp.name}</span>
                   <div className="flex items-center gap-2">
                     <span className={`text-[10px] font-mono px-1.5 py-0.5 ${
                       emp.status === 'Active' ? 'bg-zinc-100 text-black' : 'bg-zinc-50 text-zinc-400'
                     }`}>
                       {emp.status}
                     </span>
                     <button
                       onClick={() => {
                         if (window.confirm(`Are you sure you want to delete ${emp.name}? This action cannot be undone.`)) {
                           onDeleteEmployee(emp.id);
                         }
                       }}
                       className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-600 p-1"
                       title="Delete employee"
                     >
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                 </div>
                 <div className="flex justify-between items-center text-xs text-zinc-500">
                   <span>{emp.role}</span>
                   <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black" style={{ width: `${emp.efficiency}%` }}></div>
                   </div>
                 </div>
               </div>
             ))
           )}
        </div>

        {/* Add Employee Button */}
        <div className="p-4 border-t border-zinc-200 space-y-2">
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-zinc-800 transition-colors py-2 px-3 text-xs font-mono uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
          <div className="text-[10px] font-mono text-center text-zinc-500">
            DATABASE VERIFIED • ENCRYPTED
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-full overflow-hidden relative">
        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 left-4 z-10 p-2 bg-white border border-zinc-200 shadow-sm md:hidden ${isSidebarOpen ? 'hidden' : 'block'}`}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-12">
          <div className="max-w-5xl mx-auto">
            <header className="mb-6 sm:mb-8 border-b border-zinc-200 pb-4 sm:pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Command Nexus</h1>
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                  Optimization Protocol: ENABLED
                </p>
              </div>
              <div className="hidden md:block text-right">
                 {isVIP && (
                   <div className="mb-2 inline-flex items-center gap-1.5 bg-black text-white px-3 py-1 text-[10px] font-mono uppercase tracking-widest border border-white outline outline-1 outline-black">
                     <Crown className="w-3 h-3" />
                     VIP Override Active
                   </div>
                 )}
                 <div className="text-xs font-mono text-zinc-400">CPU LOAD</div>
                 <div className="text-lg font-mono font-bold">12%</div>
              </div>
            </header>

            {/* Tactical Cockpit */}
            <section className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4">
              <form onSubmit={handleBriefSubmit}>
                
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 mb-6 sm:mb-8">
                  {/* Left: Brief & Skills */}
                  <div className="flex-grow space-y-6">
                    {/* Mission Brief */}
                    <div className="relative group">
                      <div className="flex justify-between items-center mb-2">
                         <label className="block text-xs font-mono uppercase text-zinc-500">
                          Mission Brief Input
                        </label>
                      </div>
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-200 to-zinc-400 rounded-sm opacity-30 group-hover:opacity-50 blur transition duration-200"></div>
                      <textarea
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                        className="relative w-full h-32 sm:h-40 bg-white border border-zinc-200 p-4 sm:p-6 font-mono text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none shadow-sm"
                        placeholder="Describe the mission parameters, objectives, and specific constraints..."
                      />
                    </div>

                    {/* Required Skills Engine */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs font-mono uppercase text-zinc-500">Required Skill DNA</label>
                        {aiSuggestions.length > 0 && (
                          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 animate-pulse">
                            AI Detected {aiSuggestions.length} tags
                          </span>
                        )}
                      </div>
                      
                      <div className="min-h-[100px] border border-zinc-200 bg-zinc-50 p-3 sm:p-4 relative">
                        {/* Tag Input */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                          <input 
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(skillInput))}
                            className="bg-white border border-zinc-300 p-2 text-xs font-mono flex-grow sm:w-48 focus:outline-none focus:border-black"
                            placeholder="Add skill tag..."
                          />
                          <button 
                            type="button" 
                            onClick={() => handleAddSkill(skillInput)}
                            disabled={!skillInput}
                            className="p-2 bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Active Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {requiredSkills.length === 0 && (
                            <p className="text-xs text-zinc-400 italic">No constraints set.</p>
                          )}
                          {requiredSkills.map((skill, idx) => (
                            <div 
                              key={idx} 
                              className={`
                                flex items-center gap-2 px-3 py-1.5 border text-xs font-mono transition-all duration-300
                                ${skill.priority === 'Essential' 
                                  ? 'bg-black text-white border-black shadow-[0_0_15px_rgba(0,0,0,0.2)]' 
                                  : 'bg-white text-black border-black'}
                              `}
                            >
                              <span 
                                onClick={() => toggleSkillPriority(skill.name)}
                                className="cursor-pointer hover:underline decoration-1 underline-offset-2"
                              >
                                {skill.name} {skill.priority === 'Essential' && '*'}
                              </span>
                              <button type="button" onClick={() => removeSkill(skill.name)}>
                                <XIcon className={`w-3 h-3 ${skill.priority === 'Essential' ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black'}`} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* AI Suggestions */}
                        {aiSuggestions.length > 0 && (
                          <div className="border-t border-zinc-200 pt-3">
                            <p className="text-[10px] uppercase text-zinc-400 mb-2 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Smart Suggestions
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {aiSuggestions.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleAddSkill(s)}
                                  className="text-[10px] font-mono border border-dashed border-zinc-300 px-2 py-1 text-zinc-500 hover:border-black hover:text-black transition-colors bg-white"
                                >
                                  + {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Tactical Parameters Grid */}
                  <div className="w-full lg:w-72 flex-shrink-0 bg-zinc-50 p-4 sm:p-6 border border-zinc-200 h-fit">
                    <h3 className="text-xs font-bold uppercase tracking-widest border-b border-zinc-200 pb-3 mb-4 flex items-center gap-2">
                      <Target className="w-3 h-3" /> Tactical Params
                    </h3>
                    
                    <div className="space-y-4 sm:space-y-6">
                      <ControlGroup 
                        label="Location Tier" 
                        icon={Globe}
                        options={['Specific City', 'Remote', 'Anywhere']} 
                        current={tacticalParams.location}
                        onChange={(val: string) => setTacticalParams(p => ({ ...p, location: val }))}
                      />

                      <ControlGroup 
                        label="Mission Duration" 
                        icon={Clock}
                        options={['Rapid (<1wk)', 'Medium Term', 'Long Term']} 
                        current={tacticalParams.duration}
                        onChange={(val: string) => setTacticalParams(p => ({ ...p, duration: val }))}
                      />

                      <ControlGroup 
                        label="Urgency Level" 
                        icon={Zap}
                        options={['Standard', 'High Stakes', 'Immediate']} 
                        current={tacticalParams.urgency}
                        onChange={(val: string) => setTacticalParams(p => ({ ...p, urgency: val }))}
                      />

                      <ControlGroup 
                        label="Req. Clearance" 
                        icon={Shield}
                        options={['Entry', 'Mid-Tier', 'Senior Expert', 'Elite']} 
                        current={tacticalParams.clearance}
                        onChange={(val: string) => setTacticalParams(p => ({ ...p, clearance: val }))}
                      />

                      <div className="pt-2 border-t border-zinc-200">
                        <label className="flex items-center gap-2 text-[10px] font-mono uppercase text-zinc-500 mb-2">
                          <DollarSign className="w-3 h-3" /> Budget Sensitivity
                        </label>
                        <div className="flex border border-zinc-300">
                          {['Low Cost', 'Best Fit'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setTacticalParams(p => ({ ...p, budget: opt }))}
                              className={`
                                flex-1 py-2 text-[10px] font-mono uppercase transition-colors
                                ${tacticalParams.budget === opt ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-100'}
                              `}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                   <Button type="submit" disabled={isProcessing || !brief}>
                      {isProcessing ? 'CALCULATING...' : 'INITIATE TACTICAL SCAN'}
                   </Button>
                </div>
              </form>
            </section>

            {/* Processing State */}
            {isProcessing && (
              <div className="border-t border-zinc-100 pt-12 text-center animate-in fade-in">
                <BrainCircuit className="w-16 h-16 mx-auto text-black mb-6 animate-pulse" />
                <h2 className="text-xl font-medium mb-2">Analyzing Workforce DNA</h2>
                <div className="font-mono text-xs text-zinc-500 space-y-2 h-16">
                  <p className="animate-pulse text-black font-bold">{processingStep}</p>
                </div>
              </div>
            )}

            {/* Results State */}
            {showResults && !isProcessing && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 border-t border-zinc-200 pt-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold uppercase tracking-widest">Optimal Matches Identified</h2>
                  <span className="bg-black text-white text-[10px] font-mono px-2 py-1">CONFIDENCE: 98.4%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Match 1 */}
                  <div className="border-2 border-black bg-white p-6 relative shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-xs font-mono flex items-center gap-2">
                      <Star className="w-3 h-3 fill-white" />
                      #1 RECOMMENDATION
                    </div>
                    <div className="flex justify-between items-start mb-6 mt-2">
                      <div>
                        <h3 className="font-bold text-lg">Sarah Jenkins</h3>
                        <p className="text-xs font-mono text-zinc-500">Senior Strategist</p>
                      </div>
                      <div className="w-10 h-10 bg-zinc-100 flex items-center justify-center rounded-full">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="bg-zinc-50 p-3 border-l-2 border-black">
                        <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Logic Summary</p>
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">Perfect Fit:</span> Matches {tacticalParams.clearance} requirement. 
                          {requiredSkills.some(s => s.priority === 'Essential') ? ' Has all ESSENTIAL skills.' : ' High domain alignment.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <Globe className="w-3 h-3" />
                        <span>Loc: Matches {tacticalParams.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <Plane className="w-3 h-3" />
                        <span>Readiness: Immediate</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" fullWidth className="text-xs">Assign Mission</Button>
                  </div>

                  {/* Match 2 */}
                  <div className="border border-zinc-200 bg-white p-6 opacity-80 hover:opacity-100 transition-all hover:shadow-md">
                     <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-lg">David Chen</h3>
                        <p className="text-xs font-mono text-zinc-500">VP of Sales</p>
                      </div>
                    </div>
                     <div className="space-y-4 mb-6">
                      <div className="bg-white border border-zinc-100 p-3">
                        <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Logic Summary</p>
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">Budget Option:</span> {tacticalParams.budget === 'Low Cost' ? 'Best price/performance ratio.' : 'Lower cost alternative (-15%).'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" fullWidth className="text-xs bg-white text-zinc-500 hover:text-black">Assign Mission</Button>
                  </div>

                  {/* Match 3 */}
                  <div className="border border-zinc-200 bg-white p-6 opacity-80 hover:opacity-100 transition-all hover:shadow-md">
                     <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-lg">Elena Rostova</h3>
                        <p className="text-xs font-mono text-zinc-500">Lead Consultant</p>
                      </div>
                    </div>
                     <div className="space-y-4 mb-6">
                      <div className="bg-white border border-zinc-100 p-3">
                        <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Logic Summary</p>
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">Development:</span> High potential. Matches {tacticalParams.urgency} urgency profile.
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" fullWidth className="text-xs bg-white text-zinc-500 hover:text-black">Assign Mission</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <AddEmployeeModal 
          onClose={() => setShowAddEmployeeModal(false)}
          onAdd={onAddEmployee}
        />
      )}
    </div>
  );
};

// Add Employee Modal Component
interface AddEmployeeModalProps {
  onClose: () => void;
  onAdd: (employee: Employee) => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'Engineering',
    location: '',
    skills: '',
    status: 'Active' as const,
    travelReady: true,
    pastMissions: '',
    education: ''
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = () => {
    setFormData(prev => ({ ...prev, travelReady: !prev.travelReady }));
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const base64Content = base64Data.split(',')[1];
          const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

          if (!apiKey) {
            console.warn("Google API key not configured. Using mock extraction.");
            // Use mock extraction when API is not available
            setFormData(prev => ({
              ...prev,
              name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
              role: 'Senior Professional',
              location: 'TBD',
              skills: 'Communication, Problem Solving, Leadership',
              education: 'Professional Experience',
              pastMissions: 'Multiple successful projects and initiatives',
            }));
            setIsAnalyzing(false);
            return;
          }

          const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [
                  { text: `Analyze this resume/CV document and extract the following "Employee DNA" for a resource planning system. Return a purely valid JSON object (no markdown, no code blocks) with the following keys: name (string), role (string), location (string), skills (comma-separated string), education (string), pastMissions (string). If you cannot read the file, provide best guess based on filename.` },
                  { inlineData: { mimeType: file.type, data: base64Content } }
                ]
              }],
              generationConfig: {
                responseMimeType: 'application/json'
              }
            })
          });

          if (!response.ok) {
            throw new Error('API request failed');
          }

          const data = await response.json();
          const extractedData = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
          
          setFormData(prev => ({
            ...prev,
            name: extractedData.name || prev.name,
            role: extractedData.role || prev.role,
            location: extractedData.location || prev.location,
            skills: extractedData.skills || prev.skills,
            education: extractedData.education || prev.education,
            pastMissions: extractedData.pastMissions || prev.pastMissions,
          }));
          
        } catch (error) {
          console.error("CV analysis error:", error);
          // Fallback: Use filename as hint
          setFormData(prev => ({
            ...prev,
            name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          }));
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error("File reading failed", error);
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      alert('Name and role are required');
      return;
    }

    const newEmployee: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      role: formData.role,
      location: formData.location,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      status: formData.status,
      travelReady: formData.travelReady,
      pastMissions: formData.pastMissions,
      education: formData.education,
      efficiency: Math.floor(Math.random() * (100 - 85 + 1) + 85)
    };

    onAdd(newEmployee);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 max-w-lg w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Add New Employee</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CV Upload Section */}
        <div className="mb-6 pb-6 border-b border-zinc-200">
          <label className="block text-xs font-mono uppercase text-zinc-500 mb-3">Quick Upload CV (Optional)</label>
          <label 
            className={`
              group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 hover:border-black transition-colors cursor-pointer bg-zinc-50
              ${isAnalyzing ? 'animate-pulse border-black bg-zinc-100' : ''}
            `}
          >
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.txt" 
              className="hidden" 
              onChange={handleCVUpload}
              disabled={isAnalyzing}
            />
            
            {isAnalyzing ? (
              <div className="text-center">
                <Scan className="w-5 h-5 text-black mb-2 mx-auto animate-spin" />
                <p className="text-xs font-mono text-black">Analyzing CV...</p>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-5 h-5 text-zinc-400 mb-2 mx-auto group-hover:text-black transition-colors" />
                <p className="text-xs font-mono font-bold text-zinc-600">Upload CV/Resume</p>
                <p className="text-[10px] text-zinc-500">Auto-fill all fields</p>
              </div>
            )}
          </label>
          <p className="text-[10px] text-zinc-400 mt-2">Supports PDF, DOC, DOCX, TXT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-zinc-200 p-2 text-sm font-mono focus:outline-none focus:border-black"
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full border border-zinc-200 p-2 text-sm font-mono focus:outline-none focus:border-black"
              required
            >
              <option>Engineering</option>
              <option>Sales</option>
              <option>Consulting</option>
              <option>Operations</option>
              <option>Management</option>
              <option>Marketing</option>
              <option>Finance</option>
              <option>HR</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full border border-zinc-200 p-2 text-sm font-mono focus:outline-none focus:border-black"
              placeholder="City, Country"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              className="w-full border border-zinc-200 p-2 text-sm font-mono focus:outline-none focus:border-black"
              placeholder="Python, Leadership, Sales..."
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full border border-zinc-200 p-2 text-sm font-mono focus:outline-none focus:border-black"
            >
              <option>Active</option>
              <option>On Mission</option>
              <option>Travel</option>
              <option>On Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1">Education</label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              className="w-full border border-zinc-200 p-2 text-sm font-mono focus:outline-none focus:border-black"
              placeholder="Degree, certification..."
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1">Past Missions</label>
            <textarea
              name="pastMissions"
              value={formData.pastMissions}
              onChange={handleInputChange}
              className="w-full border border-zinc-200 p-2 text-sm font-mono focus:outline-none focus:border-black resize-none h-20"
              placeholder="Brief description of key projects..."
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="travelReady"
              checked={formData.travelReady}
              onChange={handleToggleChange}
              className="w-4 h-4"
            />
            <label htmlFor="travelReady" className="text-xs font-mono uppercase text-zinc-500">
              Travel Ready
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-black text-white hover:bg-zinc-800 py-2 text-xs font-mono uppercase transition-colors"
            >
              Add Employee
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-100 text-black hover:bg-zinc-200 py-2 text-xs font-mono uppercase transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
