/**
 * Employee Self-Service Profile
 */
import React, { useEffect, useState } from 'react';
import { User, MapPin, Briefcase, Zap, Save, Loader2 } from 'lucide-react';
import * as api from '../../services/api';
import type { Employee } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const MyProfile: React.FC = () => {
    const [profile, setProfile] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        location: '',
        travelEligible: false,
        availabilityFrom: '',
        availabilityTo: '',
        skills: '',
        availabilityWindows: [] as Array<{ windowType: 'holiday' | 'project_commitment' | 'personal' | 'other'; startDate: string; endDate: string; note?: string }>,
    });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        const res = await api.getEmployees();
        if (res.success && res.employees.length > 0) {
            const emp = res.employees[0]; // Employee sees only their own row
            setProfile(emp);
            setForm({
                location: emp.location,
                travelEligible: emp.travelEligible,
                availabilityFrom: emp.availabilityFrom || '',
                availabilityTo: emp.availabilityTo || '',
                skills: emp.skills.map(s => s.skill_name).join(', '),
                availabilityWindows: emp.availabilityWindows || [],
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, proficiency: 'intermediate' }));
        const res = await api.updateEmployee(profile.employeeId, {
            location: form.location,
            travelEligible: form.travelEligible,
            availabilityFrom: form.availabilityFrom || undefined,
            availabilityTo: form.availabilityTo || undefined,
            availabilityWindows: form.availabilityWindows,
            skills: skills as any,
        } as any);
        if (res.success) { await fetchProfile(); setEditMode(false); }
        setSaving(false);
    };

    if (loading) return <LoadingSpinner message="Loading your profile..." />;
    if (!profile) return <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">Profile not found. Contact HR.</p>;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">My Profile</h1>
                    <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">ID: {profile.displayId}</p>
                </div>
                {!editMode && (
                    <button onClick={() => setEditMode(true)} className="bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:bg-gray-200 transition-colors">
                        Edit
                    </button>
                )}
            </div>

            <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-[#00FF66]/10 border border-blue-500 dark:border-[#00FF66]/20 flex items-center justify-center text-3xl font-black text-blue-500 dark:text-[#00FF66]">
                        {(profile.name || '?').charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{profile.name || `Employee ${profile.displayId}`}</h2>
                        <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">{profile.department} • {profile.seniorityLevel}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-500 dark:text-[#8a8a8a]" />
                            {editMode ? (
                                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                                    className="bg-transparent border border-gray-200 dark:border-white/10 px-3 py-1.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors flex-1" />
                            ) : (
                                <span className="text-gray-500 dark:text-[#8a8a8a]">{profile.location}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="w-4 h-4 text-gray-500 dark:text-[#8a8a8a]" />
                            <span className="text-gray-500 dark:text-[#8a8a8a]">{profile.currentProjectLoad} active projects</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">Tenure:</span>
                            <span className="text-gray-900 dark:text-white">{profile.tenureYears} years</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {editMode ? (
                            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8a8a8a] cursor-pointer mb-2">
                                <input type="checkbox" checked={form.travelEligible} onChange={() => setForm({ ...form, travelEligible: !form.travelEligible })} />
                                Travel eligible
                            </label>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-[#8a8a8a] mb-2">{profile.travelEligible ? '✈ Travel eligible' : '🏠 Not travel eligible'}</p>
                        )}

                        <div className="text-sm">
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-1">Availability:</span>
                            {editMode ? (
                                <div className="flex items-center gap-2">
                                    <input type="date" value={form.availabilityFrom} onChange={e => setForm({ ...form, availabilityFrom: e.target.value })} className="bg-transparent border border-gray-200 dark:border-white/10 px-2 py-1 text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                    <span className="text-gray-500 dark:text-[#8a8a8a]">to</span>
                                    <input type="date" value={form.availabilityTo} onChange={e => setForm({ ...form, availabilityTo: e.target.value })} className="bg-transparent border border-gray-200 dark:border-white/10 px-2 py-1 text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                </div>
                            ) : (
                                <span className="text-gray-900 dark:text-white">{profile.availabilityFrom ? `${new Date(profile.availabilityFrom).toLocaleDateString()} - ${profile.availabilityTo ? new Date(profile.availabilityTo).toLocaleDateString() : 'Ongoing'}` : 'Available immediately'}</span>
                            )}
                        </div>

                        <div className="text-sm">
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Availability windows:</span>
                            {editMode ? (
                                <div className="space-y-2">
                                    {form.availabilityWindows.map((window, index) => (
                                        <div key={index} className="grid grid-cols-1 gap-2 border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md p-3 md:grid-cols-[1fr,1fr,1fr,auto]">
                                            <select value={window.windowType} onChange={e => setForm(prev => ({ ...prev, availabilityWindows: prev.availabilityWindows.map((item, i) => i === index ? { ...item, windowType: e.target.value as any } : item) }))}
                                                className="bg-transparent border border-gray-200 dark:border-white/10 px-2 py-2 text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors">
                                                <option value="holiday">Holiday</option>
                                                <option value="project_commitment">Project commitment</option>
                                                <option value="personal">Personal</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <input type="date" value={window.startDate} onChange={e => setForm(prev => ({ ...prev, availabilityWindows: prev.availabilityWindows.map((item, i) => i === index ? { ...item, startDate: e.target.value } : item) }))} className="bg-transparent border border-gray-200 dark:border-white/10 px-2 py-2 text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                            <input type="date" value={window.endDate} onChange={e => setForm(prev => ({ ...prev, availabilityWindows: prev.availabilityWindows.map((item, i) => i === index ? { ...item, endDate: e.target.value } : item) }))} className="bg-transparent border border-gray-200 dark:border-white/10 px-2 py-2 text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                            <button type="button" onClick={() => setForm(prev => ({ ...prev, availabilityWindows: prev.availabilityWindows.filter((_, i) => i !== index) }))} className="px-2 py-2 text-xs text-gray-500 dark:text-[#8a8a8a] hover:bg-white/80 dark:bg-[#1a1a1c]/80 backdrop-blur-md hover:text-[#FF3333] transition-colors">Remove</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setForm(prev => ({ ...prev, availabilityWindows: [...prev.availabilityWindows, { windowType: 'holiday', startDate: '', endDate: '' }] }))} className="text-xs text-blue-500 dark:text-[#00FF66] hover:text-gray-900 dark:text-white font-mono transition-colors">+ Add blocked window</button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {(profile.availabilityWindows || []).map(window => (
                                        <div key={`${window.windowType}-${window.startDate}-${window.endDate}`} className="border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md px-3 py-2 text-xs text-gray-500 dark:text-[#8a8a8a] font-mono">
                                            <span className="capitalize">{window.windowType.replace('_', ' ')}</span> • {new Date(window.startDate).toLocaleDateString()} - {new Date(window.endDate).toLocaleDateString()}
                                        </div>
                                    ))}
                                    {(!profile.availabilityWindows || profile.availabilityWindows.length === 0) && <span className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">No blocked windows configured.</span>}
                                </div>
                            )}
                        </div>

                        {profile.performanceScore && (
                            <p className="text-sm mt-3">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Performance:</span>{' '}
                                <span className="text-blue-500 dark:text-[#00FF66] font-black">{profile.performanceScore.toFixed(1)}/5.0</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Skills */}
            <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500 dark:text-[#00FF66]" /> Skills
                </h3>
                {editMode ? (
                    <div>
                        <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Comma-separated skills..."
                            className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">Separate skills with commas</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((s, i) => (
                            <span key={i} className="border border-blue-500 dark:border-[#00FF66]/20 bg-[#00FF66]/10 text-blue-500 dark:text-[#00FF66] px-3 py-1 text-[10px] font-mono uppercase tracking-widest">
                                {s.skill_name} <span className="opacity-60">({s.proficiency})</span>
                            </span>
                        ))}
                        {profile.skills.length === 0 && (
                            <div className="border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest w-full">
                                ➔ No skills added yet
                            </div>
                        )}
                    </div>
                )}
            </div>

            {editMode && (
                <div className="flex gap-3">
                    <button onClick={handleSave} disabled={saving}
                        className="bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                    </button>
                    <button onClick={() => setEditMode(false)} className="border border-[#333333] text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white hover:bg-white/80 dark:bg-[#1a1a1c]/80 backdrop-blur-md uppercase tracking-widest text-xs px-6 py-2.5 transition-colors">Cancel</button>
                </div>
            )}
        </div>
    );
};

export default MyProfile;
