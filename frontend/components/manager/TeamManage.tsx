/**
 * Team Management — Manager views teams and raises headcount requests
 */
import React, { useEffect, useState } from 'react';
import { Users, Plus, X, Loader2, ClipboardList } from 'lucide-react';
import * as api from '../../services/api';
import type { Team, EmployeeRequest } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const PROFICIENCIES = ['beginner', 'intermediate', 'expert'] as const;

const TeamManage: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [requests, setRequests] = useState<EmployeeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

    useEffect(() => {
        Promise.all([fetchTeams(), fetchRequests()]).finally(() => setLoading(false));
    }, []);

    const fetchTeams = async () => {
        const res = await api.getTeams();
        if (res.success) setTeams(res.teams);
    };

    const fetchRequests = async () => {
        const res = await api.getEmployeeRequests();
        if (res.success) setRequests(res.requests);
    };

    const loadMembers = async (teamId: string) => {
        setSelectedTeam(teamId);
        setMembersLoading(true);
        const res = await api.getTeamMembers(teamId);
        if (res.success) setMembers(res.members);
        setMembersLoading(false);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">My Teams</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">{teams.length} team{teams.length !== 1 ? 's' : ''} • {requests.length} staffing request{requests.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setShowRequestModal(true)}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:opacity-90 transition-opacity"
                >
                    <Plus className="h-4 w-4" /> Request Team Member
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <section className="space-y-4">
                    {teams.length === 0 ? (
                        <div className="border border-dashed border-border p-12 text-center">
                            <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">➔ No teams assigned yet. Contact HR to set up your team.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {teams.map(team => (
                                <button
                                    key={team.team_id}
                                    type="button"
                                    className={`border p-5 text-left transition-all bg-card ${selectedTeam === team.team_id ? 'border-nexus-green/40' : 'border-border hover:border-foreground/30'}`}
                                    onClick={() => loadMembers(team.team_id)}
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-bold text-foreground">{team.team_name}</h3>
                                        <Users className="h-4 w-4 text-nexus-green" />
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono">Created {new Date(team.created_at).toLocaleDateString()}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedTeam && (
                        <div className="border border-border bg-card p-6">
                            <h3 className="mb-4 font-bold text-foreground uppercase">Team Members</h3>
                            {membersLoading ? <LoadingSpinner /> : (
                                <div className="space-y-2">
                                    {members.map(m => (
                                        <div key={m.employeeId} className="flex flex-col gap-3 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nexus-purple/10 text-xs font-bold text-nexus-purple">
                                                    {(m.name || '?').charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm text-foreground">{m.name || 'Unknown Employee'}</p>
                                                    <p className="text-xs text-muted-foreground">{m.department} • {m.seniorityLevel}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">{m.location}</span>
                                        </div>
                                    ))}
                                    {members.length === 0 && <p className="text-sm text-muted-foreground font-mono">No approved members yet</p>}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section className="border border-border bg-card p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-nexus-green" />
                        <h3 className="font-bold text-foreground uppercase">Manager Requests</h3>
                    </div>
                    <div className="space-y-3">
                        {requests.map(request => (
                            <div key={request.requestId} className="border border-border bg-card/50 backdrop-blur-md p-4">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="border border-nexus-green/30 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-nexus-green">{request.requestedRole}</span>
                                    <span className={`border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${request.status === 'Approved' ? 'border-nexus-green/30 text-nexus-green bg-nexus-green/10' : request.status === 'Denied' ? 'border-nexus-red/30 text-nexus-red bg-nexus-red/10' : request.viewedAt ? 'border-nexus-orange/30 text-nexus-orange bg-nexus-orange/10' : 'border-border text-muted-foreground'}`}>
                                        {request.status === 'Pending' && request.viewedAt ? 'Viewed' : request.status}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{request.priority}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{request.skillsRequired.map(skill => skill.skill_name).join(', ') || 'No skills captured'}</p>
                                <p className="mt-2 text-xs text-muted-foreground font-mono">Raised {new Date(request.createdAt).toLocaleString()}</p>
                                {request.reviewNote && <p className="mt-2 text-xs italic text-muted-foreground">"{request.reviewNote}"</p>}
                            </div>
                        ))}
                        {requests.length === 0 && <p className="text-sm text-muted-foreground font-mono">No staffing requests submitted yet.</p>}
                    </div>
                </section>
            </div>

            {showRequestModal && (
                <RequestMemberModal
                    onClose={() => setShowRequestModal(false)}
                    onCreated={async () => {
                        await fetchRequests();
                        setShowRequestModal(false);
                    }}
                />
            )}
        </div>
    );
};

function RequestMemberModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void | Promise<void> }) {
    const [requestedRole, setRequestedRole] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [skills, setSkills] = useState([{ skill_name: '', proficiency: 'intermediate' as const, count: 1 }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const updateSkill = (index: number, field: 'skill_name' | 'proficiency' | 'count', value: string | number) => {
        setSkills(prev => prev.map((skill, i) => i === index ? { ...skill, [field]: value } : skill));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await api.createEmployeeRequest({
            requestedRole,
            priority,
            skillsRequired: skills.filter(skill => skill.skill_name.trim()).map(skill => ({
                skill_name: skill.skill_name.trim(),
                proficiency: skill.proficiency,
                count: Number(skill.count) || 1,
            })),
        });
        setLoading(false);
        if (res.success) {
            await onCreated();
            return;
        }
        setError((res as any).message || 'Failed to create request.');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-card/90 backdrop-blur-md">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
                    <div className="w-3 h-3 rounded-full bg-nexus-red"></div>
                    <div className="w-3 h-3 rounded-full bg-nexus-orange"></div>
                    <div className="w-3 h-3 rounded-full bg-nexus-green"></div>
                    <span className="ml-4 font-mono text-[10px] text-muted-foreground tracking-wider uppercase">~/nexus/action</span>
                </div>
                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Request Team Member</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Requested Role *</label>
                                <input value={requestedRole} onChange={e => setRequestedRole(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2.5 text-foreground outline-none focus:border-ring transition-colors" />
                            </div>
                            <div>
                                <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full bg-transparent border border-border px-3 py-2.5 text-foreground outline-none focus:border-ring transition-colors">
                                    {PRIORITIES.map(value => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Skills Required</label>
                                <button type="button" onClick={() => setSkills(prev => [...prev, { skill_name: '', proficiency: 'intermediate', count: 1 }])} className="text-xs text-nexus-green hover:text-foreground font-mono transition-colors">+ Add skill</button>
                            </div>
                            {skills.map((skill, index) => (
                                <div key={index} className="grid grid-cols-1 gap-3 border border-border bg-card/50 backdrop-blur-md p-3 md:grid-cols-[1.8fr,1fr,0.6fr,auto]">
                                    <input value={skill.skill_name} onChange={e => updateSkill(index, 'skill_name', e.target.value)} placeholder="Skill name" className="bg-transparent border border-border px-3 py-2 text-foreground outline-none focus:border-ring transition-colors placeholder:text-muted-foreground" />
                                    <select value={skill.proficiency} onChange={e => updateSkill(index, 'proficiency', e.target.value)} className="bg-transparent border border-border px-3 py-2 text-foreground outline-none focus:border-ring transition-colors">
                                        {PROFICIENCIES.map(value => <option key={value} value={value}>{value}</option>)}
                                    </select>
                                    <input type="number" min={1} max={20} value={skill.count} onChange={e => updateSkill(index, 'count', Number(e.target.value))} className="bg-transparent border border-border px-3 py-2 text-foreground outline-none focus:border-ring transition-colors" />
                                    <button type="button" onClick={() => setSkills(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))} className="px-2 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors">Remove</button>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 bg-destructive/5 border-l-2 border-destructive text-destructive font-mono text-xs">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">
                            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : 'Submit Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TeamManage;
