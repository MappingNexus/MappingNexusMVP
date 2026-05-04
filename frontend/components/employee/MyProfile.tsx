/**
 * Employee Self-Service Profile
 */
import React, { useEffect, useState } from 'react';
import { MapPin, Briefcase, Zap, Save, Loader2, CalendarDays, RefreshCw, Link2, Unlink } from 'lucide-react';
import * as api from '../../services/api';
import type { AvailabilityWindow, Employee } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const MyProfile: React.FC = () => {
 const [profile, setProfile] = useState<Employee | null>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [editMode, setEditMode] = useState(false);
 const [calendarStatus, setCalendarStatus] = useState<Awaited<ReturnType<typeof api.getCalendarStatus>>['status'] | null>(null);
 const [calendarBusy, setCalendarBusy] = useState<string | null>(null);
 const [calendarMessage, setCalendarMessage] = useState<string | null>(null);
 const [form, setForm] = useState({
 location: '',
 travelEligible: false,
 availabilityFrom: '',
 availabilityTo: '',
 skills: '',
 availabilityWindows: [] as AvailabilityWindow[],
 });

 useEffect(() => {
 void fetchProfile();
 void fetchCalendarStatus();

 const calendarResult = new URLSearchParams(window.location.search).get('calendar');
 if (calendarResult) {
 const readable = calendarResult.includes('connected')
 ? 'Calendar connected. Run Sync now or wait for the nightly refresh.'
 : 'Calendar connection did not complete. Please try again.';
 setCalendarMessage(readable);
 window.history.replaceState({}, document.title, window.location.pathname);
 }
 }, []);

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
 availabilityWindows: (emp.availabilityWindows || []).filter(window => window.source !== 'calendar'),
 });
 }
 setLoading(false);
 };

 const fetchCalendarStatus = async () => {
 const res = await api.getCalendarStatus();
 if (res.success) setCalendarStatus(res.status);
 };

 const connectCalendar = async (provider: api.CalendarProvider) => {
 setCalendarBusy(provider);
 setCalendarMessage(null);
 const res = await api.getCalendarAuthUrl(provider);
 if (res.success && res.authorizationUrl) {
 window.location.href = res.authorizationUrl;
 return;
 }
 setCalendarMessage(res.message || `Unable to connect ${provider}.`);
 setCalendarBusy(null);
 };

 const syncCalendar = async (provider: api.CalendarProvider) => {
 setCalendarBusy(provider);
 setCalendarMessage(null);
 const res = await api.syncCalendar(provider);
 if (res.success) {
 setCalendarMessage(`Synced ${res.syncedWindows} calendar availability window${res.syncedWindows === 1 ? '' : 's'}.`);
 await fetchCalendarStatus();
 await fetchProfile();
 } else {
 setCalendarMessage(res.message || 'Calendar sync failed.');
 }
 setCalendarBusy(null);
 };

 const disconnectCalendar = async (provider: api.CalendarProvider) => {
 setCalendarBusy(provider);
 setCalendarMessage(null);
 const res = await api.disconnectCalendar(provider);
 if (res.success) {
 setCalendarMessage(`${provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} disconnected.`);
 await fetchCalendarStatus();
 await fetchProfile();
 } else {
 setCalendarMessage(res.message || 'Unable to disconnect calendar.');
 }
 setCalendarBusy(null);
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
 if (!profile) return <p className="text-gray-500 font-mono text-xs">Profile not found. Contact HR.</p>;

 return (
 <div className="space-y-6 max-w-3xl">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">My Profile</h1>
 <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">ID: {profile.displayId}</p>
 </div>
 {!editMode && (
 <button onClick={() => setEditMode(true)} className="bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:opacity-90 transition-colors">
 Edit
 </button>
 )}
 </div>

 <div className="bg-card border border-border p-6">
 <div className="flex items-center gap-4 mb-6">
 <div className="w-16 h-16 bg-[#00FF66]/10 border border-blue-500 flex items-center justify-center text-3xl font-black text-primary dark:text-[#00FF66]">
 {(profile.name || '?').charAt(0)}
 </div>
 <div>
 <h2 className="text-xl font-black text-foreground uppercase tracking-tight">{profile.name || `Employee ${profile.displayId}`}</h2>
 <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">{profile.department} • {profile.seniorityLevel}</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-4">
 <div className="flex items-center gap-2 text-sm">
 <MapPin className="w-4 h-4 text-muted-foreground dark:text-[#8a8a8a]" />
 {editMode ? (
 <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
 className="bg-transparent border border-border px-3 py-1.5 text-foreground text-sm outline-none focus:border-primary transition-colors flex-1" />
 ) : (
 <span className="text-gray-500 dark:text-[#8a8a8a]">{profile.location}</span>
 )}
 </div>
 <div className="flex items-center gap-2 text-sm">
 <Briefcase className="w-4 h-4 text-muted-foreground dark:text-[#8a8a8a]" />
 <span className="text-gray-500 dark:text-[#8a8a8a]">{profile.currentProjectLoad} active projects</span>
 </div>
 <div className="flex items-center gap-2 text-sm">
 <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Tenure:</span>
 <span className="text-gray-900 dark:text-white">{profile.tenureYears} years</span>
 </div>
 </div>
 <div className="space-y-4">
 {editMode ? (
 <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer mb-2">
 <input type="checkbox" checked={form.travelEligible} onChange={() => setForm({ ...form, travelEligible: !form.travelEligible })} />
 Travel eligible
 </label>
 ) : (
 <p className="text-sm text-muted-foreground mb-2">{profile.travelEligible ? '✈ Travel eligible' : '🏠 Not travel eligible'}</p>
 )}

 <div className="text-sm">
 <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Availability:</span>
 {editMode ? (
 <div className="flex items-center gap-2">
 <input type="date" value={form.availabilityFrom} onChange={e => setForm({ ...form, availabilityFrom: e.target.value })} className="bg-transparent border border-border px-2 py-1 text-foreground text-xs outline-none focus:border-primary transition-colors" />
 <span className="text-gray-500 dark:text-[#8a8a8a]">to</span>
 <input type="date" value={form.availabilityTo} onChange={e => setForm({ ...form, availabilityTo: e.target.value })} className="bg-transparent border border-border px-2 py-1 text-foreground text-xs outline-none focus:border-primary transition-colors" />
 </div>
 ) : (
 <span className="text-gray-900 dark:text-white">{profile.availabilityFrom ? `${new Date(profile.availabilityFrom).toLocaleDateString()} - ${profile.availabilityTo ? new Date(profile.availabilityTo).toLocaleDateString() : 'Ongoing'}` : 'Available immediately'}</span>
 )}
 </div>

 <div className="text-sm">
 <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Availability windows:</span>
 {editMode ? (
 <div className="space-y-2">
 {form.availabilityWindows.map((window, index) => (
 <div key={index} className="grid grid-cols-1 gap-2 border border-border bg-card p-3 md:grid-cols-[1fr,1fr,1fr,auto]">
 <select value={window.windowType} onChange={e => setForm(prev => ({ ...prev, availabilityWindows: prev.availabilityWindows.map((item, i) => i === index ? { ...item, windowType: e.target.value as any } : item) }))}
 className="bg-transparent border border-border px-2 py-2 text-foreground text-xs outline-none focus:border-primary transition-colors">
 <option value="holiday">Holiday</option>
 <option value="project_commitment">Project commitment</option>
 <option value="personal">Personal</option>
 <option value="other">Other</option>
 </select>
 <input type="date" value={window.startDate} onChange={e => setForm(prev => ({ ...prev, availabilityWindows: prev.availabilityWindows.map((item, i) => i === index ? { ...item, startDate: e.target.value } : item) }))} className="bg-transparent border border-border px-2 py-2 text-foreground text-xs outline-none focus:border-primary transition-colors" />
 <input type="date" value={window.endDate} onChange={e => setForm(prev => ({ ...prev, availabilityWindows: prev.availabilityWindows.map((item, i) => i === index ? { ...item, endDate: e.target.value } : item) }))} className="bg-transparent border border-border px-2 py-2 text-foreground text-xs outline-none focus:border-primary transition-colors" />
 <button type="button" onClick={() => setForm(prev => ({ ...prev, availabilityWindows: prev.availabilityWindows.filter((_, i) => i !== index) }))} className="px-2 py-2 text-xs text-muted-foreground hover:bg-white/80 hover:text-[#FF3333] transition-colors">Remove</button>
 </div>
 ))}
 <button type="button" onClick={() => setForm(prev => ({ ...prev, availabilityWindows: [...prev.availabilityWindows, { windowType: 'holiday', startDate: '', endDate: '' }] }))} className="text-xs text-primary hover:text-gray-900 font-mono transition-colors">+ Add blocked window</button>
 {(profile.availabilityWindows || []).some(window => window.source === 'calendar') && (
 <p className="text-[10px] font-mono text-muted-foreground dark:text-[#8a8a8a]">
 Calendar-synced windows are managed from Calendar Sync and are not edited here.
 </p>
 )}
 </div>
 ) : (
 <div className="space-y-2">
 {(profile.availabilityWindows || []).map(window => (
 <div key={`${window.windowType}-${window.startDate}-${window.endDate}`} className="border border-border bg-card px-3 py-2 text-xs text-muted-foreground font-mono">
 <span className="capitalize">{window.windowType.replace('_', ' ')}</span> • {new Date(window.startDate).toLocaleDateString()} - {new Date(window.endDate).toLocaleDateString()}
 {window.source === 'calendar' && (
 <span className="ml-2 text-primary uppercase">
 {window.sourceProvider || 'calendar'}
 </span>
 )}
 </div>
 ))}
 {(!profile.availabilityWindows || profile.availabilityWindows.length === 0) && <span className="text-gray-500 font-mono text-xs">No blocked windows configured.</span>}
 </div>
 )}
 </div>

 {profile.performanceScore && (
 <p className="text-sm mt-3">
 <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">Performance:</span>{' '}
 <span className="text-blue-500 font-black">{profile.performanceScore.toFixed(1)}/5.0</span>
 </p>
 )}
 </div>
 </div>
 </div>

 {/* Skills */}
 <div className="bg-card border border-border p-6">
 <h3 className="text-lg font-bold text-foreground uppercase mb-4 flex items-center gap-2">
 <CalendarDays className="w-4 h-4 text-primary dark:text-[#00FF66]" /> Calendar Sync
 </h3>
 <p className="text-gray-500 font-mono text-xs mb-4">
 Connect Google Calendar or Outlook to automatically add OOO and multi-day busy events as holiday windows.
 </p>
 {calendarMessage && (
 <div className="border border-primary/30 bg-primary/10 text-primary px-3 py-2 text-xs font-mono mb-4">
 {calendarMessage}
 </div>
 )}
 <div className="grid gap-3 md:grid-cols-2">
 {(['google', 'outlook'] as api.CalendarProvider[]).map(provider => {
 const label = provider === 'google' ? 'Google Calendar' : 'Outlook Calendar';
 const status = calendarStatus?.[provider];
 const busy = calendarBusy === provider;
 return (
 <div key={provider} className="border border-border bg-card p-4">
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="text-sm font-black text-foreground uppercase">{label}</p>
 <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">
 {status?.connected ? 'Connected' : 'Not connected'}
 </p>
 </div>
 <span className={`h-2 w-2 rounded-full ${status?.connected ? 'bg-blue-500 dark:bg-[#00FF66]' : 'bg-gray-400'}`} />
 </div>
 {status?.lastSyncedAt && (
 <p className="text-[10px] font-mono text-muted-foreground mt-3">
 Last sync: {new Date(status.lastSyncedAt).toLocaleString()}
 </p>
 )}
 {status?.lastSyncError && (
 <p className="text-[10px] font-mono text-[#FF3333] mt-3">
 Last error: {status.lastSyncError}
 </p>
 )}
 <div className="flex flex-wrap gap-2 mt-4">
 {!status?.connected ? (
 <button type="button" disabled={busy} onClick={() => connectCalendar(provider)}
 className="bg-white text-black font-bold uppercase tracking-widest text-[10px] px-3 py-2 hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
 {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />} Connect
 </button>
 ) : (
 <>
 <button type="button" disabled={busy} onClick={() => syncCalendar(provider)}
 className="bg-white text-black font-bold uppercase tracking-widest text-[10px] px-3 py-2 hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
 {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync now
 </button>
 <button type="button" disabled={busy} onClick={() => disconnectCalendar(provider)}
 className="border border-[#333333] text-muted-foreground hover:text-[#FF3333] uppercase tracking-widest text-[10px] px-3 py-2 transition-colors disabled:opacity-50 flex items-center gap-2">
 <Unlink className="w-3 h-3" /> Disconnect
 </button>
 </>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="bg-card border border-border p-6">
 <h3 className="text-lg font-bold text-foreground uppercase mb-4 flex items-center gap-2">
 <Zap className="w-4 h-4 text-primary dark:text-[#00FF66]" /> Skills
 </h3>
 {editMode ? (
 <div>
 <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Comma-separated skills..."
 className="w-full bg-transparent border border-border px-4 py-3 text-foreground text-sm outline-none focus:border-primary transition-colors" />
 <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Separate skills with commas</p>
 </div>
 ) : (
 <div className="flex flex-wrap gap-2">
 {profile.skills.map((s, i) => (
 <span key={i} className="border border-blue-500 bg-[#00FF66]/10 text-primary px-3 py-1 text-[10px] font-mono uppercase tracking-widest">
 {s.skill_name} <span className="opacity-60">({s.proficiency})</span>
 </span>
 ))}
 {profile.skills.length === 0 && (
 <div className="border border-dashed border-border p-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest w-full">
 ➔ No skills added yet
 </div>
 )}
 </div>
 )}
 </div>

 {editMode && (
 <div className="flex gap-3">
 <button onClick={handleSave} disabled={saving}
 className="bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
 </button>
 <button onClick={() => setEditMode(false)} className="border border-[#333333] text-muted-foreground hover:text-gray-900 hover:bg-white/80 uppercase tracking-widest text-xs px-6 py-2.5 transition-colors">Cancel</button>
 </div>
 )}
 </div>
 );
};

export default MyProfile;
