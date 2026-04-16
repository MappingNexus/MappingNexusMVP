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
            <div className="bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-10 text-center">
                <p className="text-gray-500 dark:text-[#8a8a8a]">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Team Dashboard</h1>
                    <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">Your approved team members only</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setIsTeamModalOpen(true); setTeamModalError(''); setTeamModalSuccess(''); setNewTeamName(''); }} 
                        className="flex items-center gap-2 bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:bg-gray-200 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Team
                    </button>
                </div>
            </div>

            {/* Add Team Modal */}
            {isTeamModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 w-full max-w-md shadow-2xl">
                        <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Create New Team</h2>
                        {teamModalError && <div className="p-4 mb-4 bg-[#FF3333]/5 border-l-2 border-[#FF3333] text-[#FF3333] font-mono text-xs">{teamModalError}</div>}
                        {teamModalSuccess ? (
                            <div>
                                <div className="p-4 mb-4 bg-[#00FF66]/5 border-l-2 border-blue-500 dark:border-[#00FF66] text-blue-500 dark:text-[#00FF66] font-mono text-xs">{teamModalSuccess}</div>
                                <button onClick={() => setIsTeamModalOpen(false)} className="w-full border border-[#333333] text-gray-900 dark:text-white hover:bg-white hover:text-black uppercase tracking-widest text-xs px-4 py-2 transition-colors">Close</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-1">Team Name</label>
                                    <input 
                                        type="text" 
                                        value={newTeamName} 
                                        onChange={e => setNewTeamName(e.target.value)} 
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 dark:border-[#00FF66] outline-none transition-colors" 
                                        placeholder="E.g., Core Platform Team" 
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setIsTeamModalOpen(false)} className="flex-1 border border-[#333333] text-gray-900 dark:text-white hover:bg-white hover:text-black uppercase tracking-widest text-xs px-4 py-2 transition-colors">Cancel</button>
                                    <button onClick={handleCreateTeam} disabled={isCreatingTeam || !newTeamName.trim()} className="flex-1 bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        {isCreatingTeam ? 'Creating...' : 'Create Team'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!overview ? (
                <div className="bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-10 text-center">
                    <p className="text-gray-500 dark:text-[#8a8a8a]">No approved team data available yet. HR must approve team memberships before they appear here.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Users, label: 'Team Size', value: overview.totalEmployees, color: 'text-[#9D4EDD]' },
                            { icon: TrendingUp, label: 'Active', value: overview.activeCount, color: 'text-blue-500 dark:text-[#00FF66]' },
                            { icon: Activity, label: 'Burnout Risk', value: overview.burnoutRiskCount, color: 'text-[#FF3333]' },
                            { icon: Users, label: 'On Bench', value: overview.benchCount, color: 'text-[#FF9900]' },
                        ].map((k, i) => (
                            <div key={i} className="border border-gray-200 dark:border-white/10 p-5 bg-white/50 dark:bg-black/50 backdrop-blur-md">
                                <k.icon className={`w-5 h-5 ${k.color} mb-3`} />
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{k.value}</p>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">{k.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Utilization */}
                        <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Team Utilization</h3>
                            <div className="space-y-2">
                                {overview.utilizationHeatmap.map(e => (
                                    <div key={e.employeeId} className="flex items-center gap-3 py-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${e.tier === 'red' ? 'bg-[#FF3333] animate-pulse' : e.tier === 'yellow' ? 'bg-[#FF9900]' : 'bg-[#00FF66]'}`} />
                                        <span className="text-sm text-gray-900 dark:text-white flex-1 truncate">{e.name || 'Unknown Employee'}</span>
                                        <span className="text-xs text-gray-500 dark:text-[#8a8a8a]">{e.department}</span>
                                        <div className="w-16 bg-gray-700/30 h-1.5 rounded-full">
                                            <div className={`h-1.5 rounded-full ${e.tier === 'red' ? 'bg-[#FF3333]' : e.tier === 'yellow' ? 'bg-[#FF9900]' : 'bg-[#00FF66]'}`} style={{ width: `${e.utilization}%` }} />
                                        </div>
                                    </div>
                                ))}
                                {overview.utilizationHeatmap.length === 0 && <p className="text-gray-500 dark:text-[#8a8a8a] text-sm italic">No team members yet</p>}
                            </div>
                        </div>

                        {/* At-Risk */}
                        {burnout && burnout.highRiskEmployees.length > 0 && (
                            <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">At-Risk Team Members</h3>
                                <div className="space-y-3">
                                    {burnout.highRiskEmployees.slice(0, 5).map(e => (
                                        <div key={e.id} className="p-4 border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-900 dark:text-white font-medium">{e.name || 'Unknown Employee'}</span>
                                                <span className="text-xs bg-[#FF3333]/10 text-[#FF3333] px-2 py-0.5">{e.riskScore}%</span>
                                            </div>
                                            {e.signals.slice(0, 2).map((s, i) => <p key={i} className="text-xs text-gray-500 dark:text-[#8a8a8a]">• {s}</p>)}
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
