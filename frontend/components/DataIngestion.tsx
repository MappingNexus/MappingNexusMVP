import React, { useState } from 'react';
import { Button } from './Button';
import { Upload, FileText, Plus, X, Database, AlertCircle, Scan, CheckCircle2, Loader2, Save, CloudUpload } from 'lucide-react';
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
    <div className="relative min-h-screen pt-20 pb-12 px-6 overflow-hidden bg-zinc-50">

      {/* Background Gradients (Matching Hero) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-[128px]" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto animate-in fade-in duration-700">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white border border-zinc-200 rounded-2xl shadow-sm mb-6">
            <Database className="w-6 h-6 text-zinc-900" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Data Ingestion Protocol
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Populate the Nexus with Employee DNA. Upload resumes or manually input data to visualize your workforce.
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>&nbsp;</div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-full shadow-sm">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Buffered Nodes</span>
            <span className="text-sm font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full">{manualEntries.length}</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">

          {/* Smart Upload Zone */}
          <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
            <div className="max-w-2xl mx-auto">
              <label
                className={`
                  group relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-all cursor-pointer
                  ${isAnalyzing
                    ? 'border-purple-400 bg-purple-50/50'
                    : 'border-zinc-300 hover:border-zinc-900 hover:bg-white bg-white/50'}
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
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-75"></div>
                      <div className="relative bg-white rounded-full w-full h-full flex items-center justify-center shadow-md">
                        <Scan className="w-8 h-8 text-purple-600 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-1">Analyzing Document...</h3>
                    <p className="text-sm text-zinc-500">Extracting skills, history, and biometrics</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 shadow-sm">
                      <CloudUpload className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-1 group-hover:scale-105 transition-transform">Smart Upload</h3>
                    <p className="text-sm text-zinc-500 mb-3">Drop CV/Resume here to Auto-Map</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Groq AI Enabled
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* The Form */}
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

              {/* Column 1: Core & Logistics */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-zinc-300"></span> Core Identity
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 ml-1">Full Name</label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                        placeholder="e.g. Alex Vance"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 ml-1">Primary Role</label>
                        <div className="relative">
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                          >
                            <option>Engineering</option>
                            <option>Sales</option>
                            <option>Leadership</option>
                            <option>Operations</option>
                            <option>Product</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 ml-1">Location</label>
                        <input
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-zinc-300"></span> Logistics
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 ml-1">Current Status</label>
                      <div className="relative">
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                        >
                          <option value="Active">Active</option>
                          <option value="On Mission">On Mission</option>
                          <option value="Travel">Travel</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 ml-1">Travel Ready?</label>
                      <div
                        onClick={handleToggleChange}
                        className={`
                            w-full px-4 py-3 border rounded-xl cursor-pointer flex items-center justify-between transition-all duration-300
                            ${formData.travelReady
                            ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300'}
                          `}
                      >
                        <span className="text-sm font-bold">{formData.travelReady ? 'Yes' : 'No'}</span>
                        <div className={`w-3 h-3 rounded-full shadow-inner ${formData.travelReady ? 'bg-green-400' : 'bg-zinc-300'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Skill DNA & History */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-zinc-300"></span> Skill DNA
                  </h3>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Primary Skills</label>
                    <input
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
                      placeholder="Python, Negotiation, Leadership..."
                    />
                    <div className="flex flex-wrap gap-2 mt-3 min-h-[32px]">
                      {formData.skills.split(',').filter(s => s.trim()).map((tag, i) => (
                        <span key={i} className="bg-zinc-100 text-zinc-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-200">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-zinc-300"></span> History
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 ml-1">Past Missions (Summary)</label>
                      <textarea
                        name="pastMissions"
                        value={formData.pastMissions}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium resize-none"
                        placeholder="Brief list of high-stakes projects..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 ml-1">Education & Certs</label>
                      <textarea
                        name="education"
                        value={formData.education}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium resize-none"
                        placeholder="Degrees, MBA, PMP..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-12 pt-8 border-t border-zinc-100 flex justify-end">
              <Button
                onClick={handleSaveToNexus}
                className={`min-w-[200px] h-12 rounded-full shadow-lg transition-all duration-300 ${saveSuccess
                    ? 'bg-green-600 border-green-600 hover:bg-green-700 hover:shadow-green-200'
                    : 'shadow-zinc-200 hover:shadow-xl hover:scale-[1.02]'
                  }`}
                disabled={!formData.name}
              >
                {saveSuccess ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Node Mapped
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-5 h-5" /> Save to Nexus
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center pb-20">
          <Button
            onClick={handleInitialize}
            variant="outline"
            disabled={manualEntries.length === 0}
            className="rounded-full px-8 py-6 text-base font-semibold border-2 border-zinc-200 hover:border-zinc-900 hover:text-zinc-900 transition-all"
          >
            Initialize Nexus &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
};
