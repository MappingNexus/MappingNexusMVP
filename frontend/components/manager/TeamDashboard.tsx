import React, { useEffect, useState } from 'react';
import { Users, Activity, TrendingUp, Plus } from 'lucide-react';
import * as api from '../../services/api';
import type { AnalyticsOverview, BurnoutData } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const TeamDashboard: React.FC = () => {
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [burnout, setBurnout] = useState<BurnoutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for adding team
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [teamModalError, setTeamModalError] = useState('');
    const [teamModalSuccess, setTeamModalSuccess] = useState('');
    const readinessTone = overview?.projectReadiness.status === 'ready'
        ? 'border-nexus-green/20 text-nexus-green'
        : overview?.projectReadiness.status === 'watch'
            ? 'border-nexus-orange/20 text-nexus-orange'
            : 'border-nexus-red/20 text-nexus-red';
    const readinessLabel = overview?.projectReadiness.status === 'ready'
        ? 'READY'
        : overview?.projectReadiness.status === 'watch'
            ? 'WATCH'
            : 'GAP';

    useEffect(() => {
        let isActive = true;

        const loadDashboard = async () => {
            const [overviewResponse, burnoutResponse] = await Promise.all([
                api.getAnalyticsOverview(),
                api.getBurnoutData(),
            ]);

            if (!isActive) return;

            if (overviewResponse.success) {
                setOverview(overviewResponse.data);
                setError(null);
            } else {
                setOverview(null);
                setError(api.getErrorMessage(overviewResponse, 'Failed to load team dashboard data.'));
            }

            if (burnoutResponse.success) {
                setBurnout(burnoutResponse.data);
            } else {
                setBurnout(null);
            }

            setLoading(false);
        };

        void loadDashboard();

        return () => {
            isActive = false;
        };
    }, []);

    const handleCreateTeam = async () => {
        setIsCreatingTeam(true);
        setTeamModalError('');
        try {
            const user = api.getUser();
            if (!user) throw new Error('User not found');
            const res = await api.createTeam(newTeamName, user.id);
            if (res.success) {
                setTeamModalSuccess('Team created successfully.');
            } else {
                setTeamModalError(res.message || 'Failed to create team.');
            }
        } catch(err: any) {
            setTeamModalError(err.message || 'An error occurred.');
        } finally {
            setIsCreatingTeam(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading team data..." />;

    if (error && !overview) {
        return (
            <div className="bg-card/50 backdrop-blur-md border border-border p-10 text-center">
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tight">Team Dashboard</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Your approved team members only</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setIsTeamModalOpen(true); setTeamModalError(''); setTeamModalSuccess(''); setNewTeamName(''); }} 
                        className="flex items-center gap-2 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" /> Add Team
                    </button>
                </div>
            </div>

            {/* Add Team Modal */}
            {isTeamModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-card/90 backdrop-blur-md border border-border p-6 w-full max-w-md shadow-2xl">
                        <h2 className="font-black text-foreground uppercase tracking-tight mb-4">Create New Team</h2>
                        {teamModalError && <div className="p-4 mb-4 bg-destructive/5 border-l-2 border-destructive text-destructive font-mono text-xs">{teamModalError}</div>}
                        {teamModalSuccess ? (
                            <div>
                                <div className="p-4 mb-4 bg-success/5 border-l-2 border-success text-success font-mono text-xs">{teamModalSuccess}</div>
                                <button onClick={() => setIsTeamModalOpen(false)} className="w-full border border-border text-foreground hover:bg-accent uppercase tracking-widest text-xs px-4 py-2 transition-colors">Close</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Team Name</label>
                                    <input 
                                        type="text" 
                                        value={newTeamName} 
                                        onChange={e => setNewTeamName(e.target.value)} 
                                        className="w-full bg-transparent border border-border px-4 py-2 text-foreground focus:border-ring outline-none transition-colors placeholder:text-muted-foreground" 
                                        placeholder="E.g., Core Platform Team" 
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setIsTeamModalOpen(false)} className="flex-1 border border-border text-foreground hover:bg-accent uppercase tracking-widest text-xs px-4 py-2 transition-colors">Cancel</button>
                                    <button onClick={handleCreateTeam} disabled={isCreatingTeam || !newTeamName.trim()} className="flex-1 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">
                                        {isCreatingTeam ? 'Creating...' : 'Create Team'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!overview ? (
                <div className="bg-card/50 backdrop-blur-md border border-border p-10 text-center">
                    <p className="text-muted-foreground">No approved team data available yet. HR must approve team memberships before they appear here.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Users, label: 'Team Size', value: overview.totalEmployees, color: 'text-nexus-purple' },
                            { icon: TrendingUp, label: 'Active', value: overview.activeCount, color: 'text-nexus-green' },
                            { icon: Activity, label: 'Burnout Risk', value: overview.burnoutRiskCount, color: 'text-nexus-red' },
                            { icon: Users, label: 'On Bench', value: overview.benchCount, color: 'text-nexus-orange' },
                        ].map((k, i) => (
                            <div key={i} className="border border-border p-5 bg-card/50 backdrop-blur-md">
                                <k.icon className={`w-5 h-5 ${k.color} mb-3`} />
                                <p className="text-2xl font-black text-foreground">{k.value}</p>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{k.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card border border-border p-6">
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <h3 className="font-black text-foreground uppercase tracking-tight">Project Readiness</h3>
                                    <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-1">Do we have enough available people for projects starting in the next 30-60 days?</p>
                                </div>
                                <span className={`border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${readinessTone}`}>{readinessLabel}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div className="border border-border p-4">
                                    <p className="text-2xl font-black text-foreground">{overview.projectReadiness.coveragePct}%</p>
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Skill coverage</p>
                                </div>
                                <div className="border border-border p-4">
                                    <p className="text-2xl font-black text-foreground">{overview.projectReadiness.projectsAtRisk}</p>
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Projects at risk</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-5">
                                <span>{overview.projectReadiness.upcomingProjects} upcoming projects</span>
                                <span>{overview.projectReadiness.availablePeople} available people</span>
                                <span>{overview.projectReadiness.blockedPeople} blocked or saturated</span>
                            </div>
                            <div className="space-y-3">
                                {overview.projectReadiness.biggestGaps.length > 0 ? overview.projectReadiness.biggestGaps.map(gap => (
                                    <div key={`${gap.projectName}-${gap.skillName}`} className="border border-border p-4 bg-card/50 backdrop-blur-md">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-foreground uppercase">{gap.skillName}</p>
                                                <p className="text-xs text-muted-foreground font-mono mt-1">{gap.projectName}{gap.startDate ? ` • starts ${gap.startDate}` : ''}</p>
                                            </div>
                                            <span className="text-xs text-nexus-red font-mono uppercase tracking-widest">Gap {gap.gap}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono mt-2">Need {gap.demand}, available {gap.available}</p>
                                    </div>
                                )) : (
                                    <div className="border border-dashed border-border p-6 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                                        ➔ No projected staffing gaps in the next 60 days
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Utilization */}
                        <div className="bg-card border border-border p-6">
                            <h3 className="font-black text-foreground uppercase tracking-tight mb-4">Team Utilization</h3>
                            <div className="space-y-2">
                                {overview.utilizationHeatmap.map(e => (
                                    <div key={e.employeeId} className="flex items-center gap-3 py-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${e.tier === 'red' ? 'bg-nexus-red animate-pulse' : e.tier === 'yellow' ? 'bg-nexus-orange' : 'bg-nexus-green'}`} />
                                        <span className="text-sm text-foreground flex-1 truncate">{e.name || 'Unknown Employee'}</span>
                                        <span className="text-xs text-muted-foreground">{e.department}</span>
                                        <div className="w-16 bg-muted h-1.5 rounded-full">
                                            <div className={`h-1.5 rounded-full ${e.tier === 'red' ? 'bg-nexus-red' : e.tier === 'yellow' ? 'bg-nexus-orange' : 'bg-nexus-green'}`} style={{ width: `${e.utilization}%` }} />
                                        </div>
                                    </div>
                                ))}
                                {overview.utilizationHeatmap.length === 0 && <p className="text-muted-foreground text-sm italic">No team members yet</p>}
                            </div>
                        </div>

                        {/* At-Risk */}
                        {burnout && burnout.highRiskEmployees.length > 0 && (
                            <div className="bg-card border border-border p-6">
                                <h3 className="font-black text-foreground uppercase tracking-tight mb-4">At-Risk Team Members</h3>
                                <div className="space-y-3">
                                    {burnout.highRiskEmployees.slice(0, 5).map(e => (
                                        <div key={e.id} className="p-4 border border-border bg-card/50 backdrop-blur-md">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-foreground font-medium">{e.name || 'Unknown Employee'}</span>
                                                <span className="text-xs bg-nexus-red/10 text-nexus-red px-2 py-0.5">{e.riskScore}%</span>
                                            </div>
                                            {e.signals.slice(0, 2).map((s, i) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TeamDashboard;
