/**
 * HR Burnout Radar — wraps analytics/burnout endpoint
 */
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as api from '../../services/api';
import type { BurnoutData } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const HRBurnoutRadar: React.FC = () => {
    const [data, setData] = useState<BurnoutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        const loadBurnoutData = async () => {
            const response = await api.getBurnoutData();
            if (!isActive) return;

            if (response.success) {
                setData(response.data);
                setError(null);
            } else {
                setData(null);
                setError(api.getErrorMessage(response, 'Failed to load burnout data.'));
            }

            setLoading(false);
        };

        void loadBurnoutData();

        return () => {
            isActive = false;
        };
    }, []);

    if (loading) return <LoadingSpinner message="Loading Burnout Radar..." />;
    if (!data) return <p className="text-muted-foreground font-mono text-xs">{error || 'Failed to load burnout data.'}</p>;

    const tierColor = (t: string) => t === 'critical' ? 'text-nexus-red' : t === 'warning' ? 'text-nexus-orange' : 'text-nexus-green';
    const tierBg = (t: string) => t === 'Critical' ? 'bg-nexus-red/10 text-nexus-red border-nexus-red/20' : t === 'Warning' ? 'bg-nexus-orange/10 text-nexus-orange border-nexus-orange/20' : 'bg-nexus-green/10 text-nexus-green border-nexus-green/20';
    const fatigueChange = typeof data.fatigueChange === 'number' ? data.fatigueChange : null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Burnout Radar</h1>
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Real-time fatigue analysis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-6">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Global Fatigue Index</p>
                    <p className="text-4xl font-black text-foreground">{data.globalFatigueIndex}%</p>
                    {fatigueChange === null ? (
                        <p className="text-xs mt-1 text-muted-foreground font-mono">Historical trend unavailable</p>
                    ) : (
                        <p className={`text-xs mt-1 font-mono ${fatigueChange < 0 ? 'text-nexus-green' : 'text-nexus-red'}`}>
                            {fatigueChange < 0 ? '↓' : '↑'} {Math.abs(fatigueChange)}% vs last month
                        </p>
                    )}
                </div>
                <div className="bg-card border border-border p-6">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">High Risk</p>
                    <p className="text-4xl font-black text-nexus-red">{data.highRiskEmployees.length}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">employees flagged</p>
                </div>
                <div className="bg-card border border-border p-6">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Prevention ROI</p>
                    <p className="text-4xl font-black text-nexus-green">{data.costPreventionROI}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">estimated savings</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border p-6">
                    <h3 className="text-lg font-bold text-foreground uppercase mb-4">Department Fatigue</h3>
                    {data.departmentFatigue.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.departmentFatigue}>
                                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 0, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--tooltip-text)' }} />
                                <Bar dataKey="value" fill="#9D4EDD" />
                            </BarChart>
                        </ResponsiveContainer>
                        
                    ) : <p className="text-muted-foreground text-sm font-mono">No data</p>}
                    <div className="mt-4 space-y-3">
                        {data.departmentFatigue.map(d => (
                            <div key={d.name} className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{d.name}</span>
                                <span className={`text-sm font-medium font-mono ${tierColor(d.tier)}`}>{d.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border p-6">
                    <h3 className="text-lg font-bold text-foreground uppercase mb-4">High Risk Employees</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {data.highRiskEmployees.map(emp => (
                            <div key={emp.id} className="border border-border bg-card/50 backdrop-blur-md p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-foreground uppercase text-sm">{emp.name || 'Unknown Employee'}</span>
                                    <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 border ${tierBg(emp.riskTier)}`}>{emp.riskTier}</span>
                                </div>
                                <div className="w-full bg-muted h-1.5 mb-2">
                                    <div className="bg-gradient-to-r from-nexus-orange to-nexus-red h-1.5" style={{ width: `${emp.riskScore}%` }} />
                                </div>
                                {emp.signals.map((s, i) => <p key={i} className="text-xs text-muted-foreground font-mono">• {s}</p>)}
                            </div>
                        ))}
                        {data.highRiskEmployees.length === 0 && (
                            <div className="border border-dashed border-border p-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                                ➔ No high-risk employees
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRBurnoutRadar;
