import React, { useState } from 'react';
import { Button } from './Button';
import { Upload, FileText, Plus, X, Database, AlertCircle, Scan, CheckCircle2, Loader2, Save } from 'lucide-react';
import { Employee } from '../types';

interface DataIngestionProps {
  onComplete: (data: Employee[]) => void;
}

export const DataIngestion: React.FC<DataIngestionProps> = ({ onComplete }) => {
  const [manualEntries, setManualEntries] = useState<Employee[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    role: string;
    location: string;
    skills: string; // Comma separated for input
    status: 'Active' | 'On Mission' | 'Travel' | 'On Leave';
    travelReady: boolean;
    pastMissions: string;
    education: string;
  }>({
    name: '',
    role: 'Engineering',
    location: '',
    skills: '',
    status: 'Active',
    travelReady: true,
    pastMissions: '',
    education: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = () => {
    setFormData(prev => ({ ...prev, travelReady: !prev.travelReady }));
  };

  const handleSmartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      if (!apiKey) {
        console.warn("Groq API key not configured. Using mock extraction.");
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

      // Read file as text (for .txt files) or use filename for analysis
      const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      
      const analyzeWithGroq = async (fileContent: string) => {
        try {
          const prompt = `Analyze this resume/CV information and extract the following "Employee DNA" for a resource planning system. Return ONLY a valid JSON object (no markdown, no code blocks, no explanations) with these exact keys: name (string), role (string), location (string), skills (comma-separated string), education (string), pastMissions (string). 

${fileContent ? `File content:\n${fileContent}` : `Filename: ${fileName}`}

If information is missing, make reasonable inferences based on the filename and context.`;

          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.1-70b-versatile', // Fast and capable Groq model
              messages: [
                {
                  role: 'system',
                  content: 'You are a resume parser. Always return valid JSON only, no markdown formatting.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.3
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'Groq API request failed');
          }

          const data = await response.json();
          const extractedText = data.choices?.[0]?.message?.content || '{}';
          const extractedData = JSON.parse(extractedText);
          
          setFormData(prev => ({
            ...prev,
            name: extractedData.name || fileName || prev.name,
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
            name: fileName,
          }));
        } finally {
          setIsAnalyzing(false);
        }
      };

      // Read as text for .txt files, otherwise analyze based on filename
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const fileContent = reader.result as string;
          await analyzeWithGroq(fileContent);
        };
        reader.readAsText(file);
      } else {
        // For PDF/DOC files, analyze based on filename
        await analyzeWithGroq(`Filename: ${fileName}`);
      }

    } catch (error) {
      console.error("File reading failed", error);
      setIsAnalyzing(false);
    }
  };

  const handleSaveToNexus = () => {
    if (!formData.name || !formData.role) return;

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
      efficiency: Math.floor(Math.random() * (100 - 85 + 1) + 85) // Simulated efficiency score
    };

    setManualEntries(prev => [...prev, newEmployee]);
    setSaveSuccess(true);
    
    // Reset form and success state after delay
    setTimeout(() => {
      setSaveSuccess(false);
      setFormData({
        name: '',
        role: 'Engineering',
        location: '',
        skills: '',
        status: 'Active',
        travelReady: true,
        pastMissions: '',
        education: ''
      });
    }, 1500);
  };

  const handleInitialize = () => {
    // Add some simulated data if user only added one or none to populate the dashboard better
    const simulatedFileData: Employee[] = manualEntries.length < 3 ? [
      { 
        id: 'sim-1', 
        name: 'Sarah Jenkins', 
        role: 'Senior Strategist', 
        status: 'Active', 
        efficiency: 98,
        location: 'New York, USA',
        skills: ['Negotiation', 'Crisis Management', 'Japanese'],
        travelReady: true,
        pastMissions: 'Led the Tokyo Merger acquisition. Managed $50M crisis fund.',
        education: 'MBA, Harvard Business School'
      },
      { 
        id: 'sim-2', 
        name: 'David Chen', 
        role: 'VP of Sales', 
        status: 'Travel', 
        efficiency: 92,
        location: 'London, UK',
        skills: ['Enterprise Sales', 'Cloud Architecture', 'Python'],
        travelReady: true,
        pastMissions: 'Expanded EMEA market share by 200%.',
        education: 'BS Computer Science, Stanford'
      },
      { 
        id: 'sim-3', 
        name: 'Elena Rostova', 
        role: 'Lead Consultant', 
        status: 'On Mission', 
        efficiency: 95,
        location: 'Berlin, Germany',
        skills: ['Supply Chain', 'Logistics', 'German'],
        travelReady: false,
        pastMissions: 'Optimized Rhine logistics network.',
        education: 'MSc Logistics, TU Munich'
      }
    ] : [];

    onComplete([...simulatedFileData, ...manualEntries]);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-10 border-b border-zinc-200 pb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6" />
            <h1 className="text-3xl font-bold tracking-tight">Data Ingestion Protocol</h1>
          </div>
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            Populate the Nexus with Employee DNA
          </p>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-mono uppercase text-zinc-400">Buffered Nodes</p>
           <p className="text-2xl font-bold">{manualEntries.length}</p>
        </div>
      </div>

      <div className="bg-white border-2 border-nexus-charcoal shadow-xl relative overflow-hidden">
        
        {/* Smart Upload Zone */}
        <div className="bg-zinc-50 p-8 border-b border-zinc-200">
           <div className="max-w-xl mx-auto">
             <label 
              className={`
                group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 hover:border-nexus-charcoal transition-colors cursor-pointer bg-white
                ${isAnalyzing ? 'animate-pulse border-nexus-charcoal bg-zinc-50' : ''}
              `}
             >
               <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt" 
                  className="hidden" 
                  onChange={handleSmartUpload}
                  disabled={isAnalyzing}
               />
               
               {isAnalyzing ? (
                 <div className="text-center">
                   <Scan className="w-8 h-8 text-black mb-3 mx-auto animate-spin" />
                   <h3 className="font-mono text-sm uppercase font-bold tracking-widest mb-1">Reading DNA...</h3>
                   <p className="text-xs text-zinc-500">Extracting skills, history, and biometrics</p>
                 </div>
               ) : (
                 <div className="text-center">
                   <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-200 transition-colors">
                      <FileText className="w-5 h-5 text-nexus-charcoal" />
                   </div>
                   <h3 className="font-mono text-sm uppercase font-bold tracking-widest mb-1">Smart Upload</h3>
                   <p className="text-xs text-zinc-500 mb-2">Drop CV/Resume to Auto-Map</p>
                   <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2 py-1">GROQ AI ENABLED</span>
                 </div>
               )}
             </label>
           </div>
        </div>

        {/* The Form */}
        <div className="p-8 md:p-12">
           <h2 className="text-sm font-mono uppercase tracking-widest border-l-4 border-black pl-3 mb-8">
             Node Configuration
           </h2>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             
             {/* Column 1: Core & Logistics */}
             <div className="space-y-6">
               <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 border-b border-zinc-100 pb-2">01 // Core Identity</h3>
               
               <div>
                 <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Full Name</label>
                 <input 
                   name="name"
                   value={formData.name}
                   onChange={handleInputChange}
                   className="w-full bg-zinc-50 border border-zinc-200 p-3 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                   placeholder="e.g. Alex Vance"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Primary Role</label>
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-50 border border-zinc-200 p-3 text-sm focus:outline-none focus:border-black"
                    >
                      <option>Engineering</option>
                      <option>Sales</option>
                      <option>Leadership</option>
                      <option>Operations</option>
                      <option>Product</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Location</label>
                    <input 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-50 border border-zinc-200 p-3 text-sm focus:outline-none focus:border-black"
                      placeholder="City, Country"
                    />
                 </div>
               </div>

               <div className="pt-4">
                 <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 border-b border-zinc-100 pb-2">02 // Logistics</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Current Status</label>
                      <select 
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 text-sm focus:outline-none focus:border-black"
                      >
                        <option value="Active">Active</option>
                        <option value="On Mission">On Mission</option>
                        <option value="Travel">Travel</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Travel Ready?</label>
                      <div 
                        onClick={handleToggleChange}
                        className={`
                          w-full p-3 border cursor-pointer flex items-center justify-between transition-colors
                          ${formData.travelReady ? 'bg-black border-black text-white' : 'bg-white border-zinc-200 text-zinc-400'}
                        `}
                      >
                        <span className="text-xs font-mono uppercase">{formData.travelReady ? 'YES' : 'NO'}</span>
                        <div className={`w-2 h-2 rounded-full ${formData.travelReady ? 'bg-green-500' : 'bg-zinc-300'}`}></div>
                      </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Column 2: Skill DNA & History */}
             <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 border-b border-zinc-100 pb-2">03 // Skill DNA</h3>
                
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Primary Skills (Comma Separated)</label>
                  <input 
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 border border-zinc-200 p-3 text-sm focus:outline-none focus:border-black"
                    placeholder="Python, Negotiation, Leadership..."
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.split(',').filter(s => s.trim()).map((tag, i) => (
                      <span key={i} className="bg-zinc-100 text-zinc-600 text-[10px] font-mono px-2 py-1 uppercase">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                   <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 border-b border-zinc-100 pb-2">04 // History</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Past Missions (Summary)</label>
                       <textarea 
                          name="pastMissions"
                          value={formData.pastMissions}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full bg-zinc-50 border border-zinc-200 p-3 text-sm focus:outline-none focus:border-black resize-none"
                          placeholder="Brief list of high-stakes projects..."
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Education & Certs</label>
                       <textarea 
                          name="education"
                          value={formData.education}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full bg-zinc-50 border border-zinc-200 p-3 text-sm focus:outline-none focus:border-black resize-none"
                          placeholder="Degrees, MBA, PMP..."
                       />
                     </div>
                   </div>
                </div>
             </div>
           </div>

           {/* Actions */}
           <div className="mt-10 pt-8 border-t border-zinc-100 flex justify-end">
             <Button 
               onClick={handleSaveToNexus} 
               className={`min-w-[180px] transition-all duration-300 ${saveSuccess ? 'bg-green-600 border-green-600 hover:bg-green-700' : ''}`}
               disabled={!formData.name}
             >
               {saveSuccess ? (
                 <span className="flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> Node Mapped
                 </span>
               ) : (
                 <span className="flex items-center gap-2">
                   <Save className="w-4 h-4" /> Save to Nexus
                 </span>
               )}
             </Button>
           </div>
        </div>
      </div>

      <div className="mt-12 flex justify-between items-center">
        <div className="text-xs text-zinc-400 font-mono">
           {manualEntries.length === 0 ? 'STATUS: WAITING FOR INPUT' : 'STATUS: READY TO INITIALIZE'}
        </div>
        <Button 
          onClick={handleInitialize} 
          variant="outline"
          disabled={manualEntries.length === 0}
        >
          Initialize Nexus &rarr;
        </Button>
      </div>
    </div>
  );
};
