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
    if (!data) return <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">{error || 'Failed to load burnout data.'}</p>;

    const tierColor = (t: string) => t === 'critical' ? 'text-[#FF3333]' : t === 'warning' ? 'text-[#FF9900]' : 'text-blue-500 dark:text-[#00FF66]';
    const tierBg = (t: string) => t === 'Critical' ? 'bg-[#FF3333]/10 text-[#FF3333] border-[#FF3333]/20' : t === 'Warning' ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20' : 'bg-[#00FF66]/10 text-blue-500 dark:text-[#00FF66] border-blue-500 dark:border-[#00FF66]/20';
    const fatigueChange = typeof data.fatigueChange === 'number' ? data.fatigueChange : null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Burnout Radar</h1>
                <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">Real-time fatigue analysis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Global Fatigue Index</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">{data.globalFatigueIndex}%</p>
                    {fatigueChange === null ? (
                        <p className="text-xs mt-1 text-gray-500 dark:text-[#8a8a8a] font-mono">Historical trend unavailable</p>
                    ) : (
                        <p className={`text-xs mt-1 font-mono ${fatigueChange < 0 ? 'text-blue-500 dark:text-[#00FF66]' : 'text-[#FF3333]'}`}>
                            {fatigueChange < 0 ? '↓' : '↑'} {Math.abs(fatigueChange)}% vs last month
                        </p>
                    )}
                </div>
                <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">High Risk</p>
                    <p className="text-4xl font-black text-[#FF3333]">{data.highRiskEmployees.length}</p>
                    <p className="text-xs text-gray-500 dark:text-[#8a8a8a] font-mono mt-1">employees flagged</p>
                </div>
                <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Prevention ROI</p>
                    <p className="text-4xl font-black text-blue-500 dark:text-[#00FF66]">{data.costPreventionROI}</p>
                    <p className="text-xs text-gray-500 dark:text-[#8a8a8a] font-mono mt-1">estimated savings</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase mb-4">Department Fatigue</h3>
                    {data.departmentFatigue.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.departmentFatigue}>
                                <XAxis dataKey="name" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={{ stroke: '#2A2A2A' }} tickLine={false} />
                                <YAxis tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={{ stroke: '#2A2A2A' }} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: 0, fontFamily: 'monospace', fontSize: 12 }} />
                                <Bar dataKey="value" fill="#9D4EDD" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-gray-500 dark:text-[#8a8a8a] text-sm font-mono">No data</p>}
                    <div className="mt-4 space-y-3">
                        {data.departmentFatigue.map(d => (
                            <div key={d.name} className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-[#8a8a8a]">{d.name}</span>
                                <span className={`text-sm font-medium font-mono ${tierColor(d.tier)}`}>{d.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#111111] border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase mb-4">High Risk Employees</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {data.highRiskEmployees.map(emp => (
                            <div key={emp.id} className="border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-gray-900 dark:text-white uppercase text-sm">{emp.name || 'Unknown Employee'}</span>
                                    <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 border ${tierBg(emp.riskTier)}`}>{emp.riskTier}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-[#2a2a2a] h-1.5 mb-2">
                                    <div className="bg-gradient-to-r from-[#FF9900] to-[#FF3333] h-1.5" style={{ width: `${emp.riskScore}%` }} />
                                </div>
                                {emp.signals.map((s, i) => <p key={i} className="text-xs text-gray-500 dark:text-[#8a8a8a] font-mono">• {s}</p>)}
                            </div>
                        ))}
                        {data.highRiskEmployees.length === 0 && (
                            <div className="border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">
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
