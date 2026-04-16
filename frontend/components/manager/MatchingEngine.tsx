/**
 * AI Matching Engine UI — Manager submits requirements, gets AI-ranked candidates
 */
import React, { useState, useEffect } from 'react';
import { Target, Plus, X, Loader2, Sparkles, AlertTriangle, CheckCircle, Eye, TrendingDown, Zap, UserPlus } from 'lucide-react';
import * as api from '../../services/api';
import type { MatchResult, Project } from '../../types';

const SKILL_SUGGESTIONS = ['React', 'Python', 'AWS', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'Machine Learning', 'Go', 'Kubernetes', 'SAP', 'CRISPR', 'Genomics'];
const SENIORITY = ['', 'junior', 'mid', 'senior', 'lead', 'principal'];

const MatchingEngine: React.FC = () => {
    const [skills, setSkills] = useState<{ name: string; priority: 'Essential' | 'Preferred' }[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [brief, setBrief] = useState('');
    const [seniority, setSeniority] = useState('');
    const [budget, setBudget] = useState('');
    const [travelReq, setTravelReq] = useState(false);
    const [results, setResults] = useState<MatchResult[] | null>(null);
    const [scanning, setScanning] = useState(false);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [aiEnhanced, setAiEnhanced] = useState(false);
    const [searchMethod, setSearchMethod] = useState<'semantic' | 'keyword'>('keyword');
    const [companyAvgCost, setCompanyAvgCost] = useState<number | null>(null);

    // Assignment state
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
    const [assignError, setAssignError] = useState<string | null>(null);
    const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

    // Load projects for the assignment selector
    useEffect(() => {
        api.getProjects().then(res => {
            if (res.success) {
                // Only show planned/active projects
                setProjects((res.projects || []).filter(p => p.status !== 'completed'));
            }
        }).catch(() => {});
    }, []);

    const addSkill = (name: string) => {
        if (!name.trim() || skills.find(s => s.name.toLowerCase() === name.toLowerCase())) return;
        setSkills([...skills, { name: name.trim(), priority: 'Essential' }]);
        setNewSkill('');
    };

    const removeSkill = (idx: number) => setSkills(skills.filter((_, i) => i !== idx));
    const togglePriority = (idx: number) => {
        const updated = [...skills];
        updated[idx].priority = updated[idx].priority === 'Essential' ? 'Preferred' : 'Essential';
        setSkills(updated);
    };

    const runMatch = async () => {
        if (skills.length === 0) return;
        setScanning(true);
        setResults(null);
        setMatchError(null);
        const res = await api.runMatch({
            skills,
            seniorityLevel: seniority || undefined,
            budgetCeiling: budget ? parseInt(budget) : undefined,
            travelRequired: travelReq,
        }, brief);
        if (res.success) {
            setResults(res.matches);
            setAiEnhanced(res.aiEnhanced);
            setSearchMethod(res.searchMethod || 'keyword');
            setCompanyAvgCost(res.companyAvgCostPerDay || null);
        } else {
            setAiEnhanced(false);
            setSearchMethod('keyword');
            setCompanyAvgCost(null);
            setMatchError(api.getErrorMessage(res, 'Matching failed. Please try again.'));
        }
        setScanning(false);
    };

    const tierColor = (score: number) => score >= 70 ? 'text-blue-500 dark:text-[#00FF66]' : score >= 40 ? 'text-[#FF9900]' : 'text-[#FF3333]';
    const tierBg = (score: number) => score >= 70 ? 'border-blue-500 dark:border-[#00FF66]/20' : score >= 40 ? 'border-[#FF9900]/20' : 'border-[#FF3333]/20';

    const assignEmployee = async (employeeId: string) => {
        if (!selectedProjectId) {
            setAssignError('Please select a project first.');
            setTimeout(() => setAssignError(null), 3000);
            return;
        }
        setAssigningId(employeeId);
        setAssignError(null);
        setAssignSuccess(null);
        try {
            const selectedProject = projects.find(p => p.project_id === selectedProjectId);
            const res = await api.createAssignment({
                employeeId,
                projectId: selectedProjectId,
                startDate: selectedProject?.start_date || new Date().toISOString().split('T')[0],
                endDate: selectedProject?.end_date || undefined,
            });
            if (res.success) {
                setAssignedIds(prev => new Set(prev).add(employeeId));
                setAssignSuccess(`Employee assigned to ${selectedProject?.project_name || 'project'} successfully.`);
                setTimeout(() => setAssignSuccess(null), 3000);
            } else {
                setAssignError((res as any).message || 'Assignment failed.');
                setTimeout(() => setAssignError(null), 4000);
            }
        } catch {
            setAssignError('Assignment failed. Please try again.');
            setTimeout(() => setAssignError(null), 4000);
        } finally {
            setAssigningId(null);
        }
    };

    const sendMatchFeedback = async (feedback: 'thumbs_up' | 'thumbs_down', candidate?: MatchResult) => {
        const reason = feedback === 'thumbs_down'
            ? prompt('Why is this AI suggestion not helpful?') || undefined
            : undefined;

        await api.sendTelemetry({
            eventType: 'match_feedback',
            feedback,
            metadata: {
                employeeId: candidate?.employee.employeeId,
                confidenceScore: candidate?.confidenceScore,
                rejectionReason: reason,
                requestedSkills: skills.map(skill => skill.name),
            },
        });
    };

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2"><Target className="w-6 h-6 text-blue-500 dark:text-[#00FF66]" />Matching Engine</h1><p className="text-gray-500 dark:text-[#8a8a8a] text-sm font-mono">Find the best talent for your project</p></div>

            {/* Input Panel */}
            <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Mission Brief</h3>
                <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={3} placeholder="Describe the project, goals, and context..."
                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-4 py-3 text-gray-900 dark:text-white text-sm placeholder-[#8A8A8A] outline-none focus:border-blue-500 dark:border-[#00FF66] resize-none mb-4 font-mono transition-colors" />

                {/* Skills */}
                <div className="mb-4">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2 block">Required Skills</label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {skills.map((s, i) => (
                            <span key={i} className={`inline-flex items-center gap-1.5 border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${s.priority === 'Essential' ? 'border-[#9D4EDD]/50 text-[#9D4EDD]' : 'border-[#333333] text-gray-500 dark:text-[#8a8a8a]'}`}>
                                {s.name}
                                <button onClick={() => togglePriority(i)} className="text-xs opacity-60 hover:opacity-100">({s.priority[0]})</button>
                                <button onClick={() => removeSkill(i)} className="ml-1 hover:text-[#FF3333]"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill(newSkill)} placeholder="Add a skill..."
                            className="flex-1 bg-transparent border border-gray-200 dark:border-white/10 px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:border-[#00FF66] font-mono text-sm transition-colors" />
                        <button onClick={() => addSkill(newSkill)} className="border border-[#333333] text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white px-3 py-2.5 transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {SKILL_SUGGESTIONS.filter(s => !skills.find(sk => sk.name === s)).slice(0, 6).map(s => (
                            <button key={s} onClick={() => addSkill(s)} className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] border border-gray-200 dark:border-white/10 hover:text-gray-900 dark:text-white px-2.5 py-1 transition-colors">{s}</button>
                        ))}
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-1 block">Seniority</label>
                        <select value={seniority} onChange={e => setSeniority(e.target.value)}
                            className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:border-[#00FF66] font-mono text-sm transition-colors">
                            <option value="">Any</option>{SENIORITY.filter(Boolean).map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-1 block">Budget Ceiling (₹/day)</label>
                        <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="Optional"
                            className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:border-[#00FF66] font-mono text-sm transition-colors" />
                    </div>
                    <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] cursor-pointer">
                            <input type="checkbox" checked={travelReq} onChange={() => setTravelReq(!travelReq)} className="w-4 h-4 accent-[#00FF66]" />Travel Required
                        </label>
                    </div>
                </div>

                <button onClick={runMatch} disabled={skills.length === 0 || scanning}
                    className="bg-white text-black font-bold uppercase tracking-widest text-xs px-8 py-3 hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {scanning ? <><Loader2 className="w-5 h-5 animate-spin" /> Scanning workforce...</> : <><Sparkles className="w-5 h-5" /> Find Matches</>}
                </button>

                {matchError && (
                    <div className="mt-4 border border-[#FF3333]/20 bg-[#FF3333]/10 px-4 py-3 text-sm text-[#FF3333]">
                        {matchError}
                    </div>
                )}
            </div>

            {/* Results */}
            {results && (
                <div className="space-y-4">
                    {/* Assignment Bar: Project selector + status messages */}
                    <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] whitespace-nowrap">Assign to Project:</label>
                            <select
                                value={selectedProjectId}
                                onChange={e => setSelectedProjectId(e.target.value)}
                                className="flex-1 min-w-[200px] bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:border-[#00FF66] font-mono text-sm transition-colors"
                            >
                                <option value="">Select a project…</option>
                                {projects.map(p => (
                                    <option key={p.project_id} value={p.project_id}>
                                        {p.project_name} ({p.status}{p.end_date ? ` • ends ${p.end_date}` : ''})
                                    </option>
                                ))}
                            </select>
                            {projects.length === 0 && (
                                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF9900]">No active projects found. Ask HR to create a project first.</span>
                            )}
                        </div>
                        {assignError && (
                            <div className="mt-2 text-sm text-[#FF3333] bg-[#FF3333]/10 border border-[#FF3333]/20 px-3 py-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />{assignError}
                            </div>
                        )}
                        {assignSuccess && (
                            <div className="mt-2 text-sm text-blue-500 dark:text-[#00FF66] bg-[#00FF66]/10 border border-blue-500 dark:border-[#00FF66]/20 px-3 py-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />{assignSuccess}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{results.length} Match{results.length !== 1 ? 'es' : ''} Found</h3>
                        <div className="flex items-center gap-2">
                            {searchMethod === 'semantic' && <span className="border border-[#9D4EDD]/30 text-[#9D4EDD] text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 flex items-center gap-1"><Zap className="w-3 h-3" /> Semantic Search</span>}
                            {aiEnhanced && <span className="border border-[#9D4EDD]/30 text-[#9D4EDD] text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Enhanced</span>}
                        </div>
                    </div>

                    {results.map(m => (
                        <div key={m.employee.employeeId} className={`border p-5 bg-white/50 dark:bg-black/50 backdrop-blur-md hover:border-[#444] transition-colors ${tierBg(m.confidenceScore)}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-3xl font-bold ${tierColor(m.confidenceScore)}`}>{m.confidenceScore}%</span>
                                        <span className="border border-gray-200 dark:border-white/10 text-gray-500 dark:text-[#8a8a8a] px-2 py-0.5 text-xs font-mono uppercase tracking-widest">#{m.rank}</span>
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-black text-lg">{m.employee.name || 'Unknown Employee'}</p>
                                    <p className="text-sm text-gray-500 dark:text-[#8a8a8a] font-mono">{m.employee.department} • {m.employee.seniorityLevel} • {m.employee.location}</p>
                                    {m.aiExplanation && <p className="text-sm text-gray-500 dark:text-[#8a8a8a] mt-3 bg-[#111111] border border-gray-200 dark:border-white/10 p-3 italic">{m.aiExplanation}</p>}

                                    {/* ROI Estimate */}
                                    {m.roiEstimate && (
                                        <div className={`mt-3 p-3 flex items-center gap-3 border ${m.roiEstimate.savingsPerDay > 0 ? 'bg-[#00FF66]/10 border-blue-500 dark:border-[#00FF66]/20' : 'bg-[#FF3333]/10 border-[#FF3333]/20'}`}>
                                            <TrendingDown className={`w-5 h-5 ${m.roiEstimate.savingsPerDay > 0 ? 'text-blue-500 dark:text-[#00FF66]' : 'text-[#FF3333]'}`} />
                                            <div>
                                                <p className={`text-sm font-medium ${m.roiEstimate.savingsPerDay > 0 ? 'text-blue-500 dark:text-[#00FF66]' : 'text-[#FF3333]'}`}>
                                                    {m.roiEstimate.savingsPerDay > 0
                                                        ? `This assignment saves ₹${Math.abs(m.roiEstimate.savingsPerDay).toLocaleString()}/day vs company avg (${m.roiEstimate.savingsPercent}% less)`
                                                        : `This assignment costs ₹${Math.abs(m.roiEstimate.savingsPerDay).toLocaleString()}/day more than company avg`
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-[#8a8a8a] mt-0.5 font-mono">
                                                    Projected 90-day savings: <span className={m.roiEstimate.projected90DaySavings > 0 ? 'text-blue-500 dark:text-[#00FF66] font-bold' : 'text-[#FF3333] font-bold'}>
                                                        {m.roiEstimate.projected90DaySavings > 0 ? '+' : ''}₹{m.roiEstimate.projected90DaySavings.toLocaleString()}
                                                    </span>
                                                    {' • '}Candidate: ₹{m.roiEstimate.candidateCostPerDay.toLocaleString()}/day vs avg ₹{m.roiEstimate.companyAvgCostPerDay.toLocaleString()}/day
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right space-y-1 text-xs text-gray-500 dark:text-[#8a8a8a] font-mono min-w-[120px]">
                                    <p>Skill: <span className="text-gray-900 dark:text-white">{m.skillMatchScore}%</span></p>
                                    <p>Avail: <span className="text-gray-900 dark:text-white">{m.availabilityScore}%</span></p>
                                    <p>Cost: <span className="text-gray-900 dark:text-white">{m.costFitScore}%</span></p>
                                    <p>Seniority: <span className="text-gray-900 dark:text-white">{m.seniorityMatchScore}%</span></p>
                                </div>
                            </div>

                            {/* Skills Pills */}
                            <div className="flex flex-wrap gap-1.5 mt-3">{m.employee.skills.map((s, i) => {
                                const isReq = skills.some(rs => (rs.name || '').toLowerCase() === (s.skill_name || '').toLowerCase());
                                return <span key={i} className={`border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${isReq ? 'border-[#9D4EDD]/50 text-[#9D4EDD]' : 'border-[#333333] text-gray-500 dark:text-[#8a8a8a]'}`}>{s.skill_name}</span>;
                            })}</div>

                            {/* AI Flags */}
                            {m.aiFlags && m.aiFlags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">{m.aiFlags.map((f, i) => (
                                    <span key={i} className="border border-[#FF9900]/20 bg-[#FF9900]/10 text-[#FF9900] text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{f}</span>
                                ))}</div>
                            )}

                            {/* Feedback + Assign */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                                <button onClick={() => sendMatchFeedback('thumbs_up', m)}
                                    className="text-xs text-gray-500 dark:text-[#8a8a8a] hover:text-blue-500 dark:text-[#00FF66] transition-colors font-mono uppercase tracking-widest">👍 Helpful</button>
                                <button onClick={() => sendMatchFeedback('thumbs_down', m)}
                                    className="text-xs text-gray-500 dark:text-[#8a8a8a] hover:text-[#FF3333] transition-colors font-mono uppercase tracking-widest">👎 Not helpful</button>
                                <div className="flex-1" />
                                {assignedIds.has(m.employee.employeeId) ? (
                                    <span className="text-xs text-blue-500 dark:text-[#00FF66] flex items-center gap-1 font-mono uppercase tracking-widest"><CheckCircle className="w-3.5 h-3.5" /> Assigned</span>
                                ) : (
                                    <button
                                        onClick={() => assignEmployee(m.employee.employeeId)}
                                        disabled={assigningId === m.employee.employeeId || !selectedProjectId}
                                        className="flex items-center gap-1.5 border border-[#333333] text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white uppercase tracking-widest text-xs px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        title={!selectedProjectId ? 'Select a project above first' : 'Assign this employee to the selected project'}
                                    >
                                        {assigningId === m.employee.employeeId
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Assigning…</>
                                            : <><UserPlus className="w-3.5 h-3.5" /> Assign</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {results.length === 0 && (
                        <div className="bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-12 text-center">
                            <Eye className="w-12 h-12 text-gray-500 dark:text-[#8a8a8a] mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono">No matches found. Try broader requirements or different skills.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MatchingEngine;
