/**
 * HR Burnout Radar — analytics/burnout
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

 const fatigueChange = typeof data?.fatigueChange === 'number' ? data.fatigueChange : null;

 const tooltipStyle = useMemo(
 () => ({
 backgroundColor: 'var(--tooltip-bg)',
 border: '1px solid var(--tooltip-border)',
 borderRadius: 16,
 fontFamily: 'var(--font-sans)',
 fontSize: 12,
 color: 'var(--tooltip-text)',
 }),
 [],
 );

 if (loading) return <LoadingSpinner message="Loading burnout radar…" />;
 if (!data) return <p className="text-muted-foreground text-sm">{error || 'Failed to load burnout data.'}</p>;

 const tierText = (tier: string) => (tier === 'critical' ? 'text-nexus-red' : tier === 'warning' ? 'text-nexus-orange' : 'text-nexus-green');

 return (
 <div className="cb-page">
 <div className="cb-page-header">
 <div>
 <h1 className="cb-h1">Burnout radar</h1>
 <p className="cb-subtitle mt-3">Real-time fatigue signals and risk concentration by department.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="cb-card p-8">
 <p className="cb-caption">Global fatigue index</p>
 <p className="mt-4 text-5xl font-mono font-medium text-foreground">{data.globalFatigueIndex}%</p>
 <div className="mt-4 text-sm">
 {fatigueChange === null ? (
 <span className="cb-body">Historical trend unavailable</span>
 ) : (
 <span className={`font-mono ${fatigueChange < 0 ? 'text-nexus-green' : 'text-nexus-red'}`}>
 {fatigueChange < 0 ? '↓' : '↑'} {Math.abs(fatigueChange)}%
 <span className="cb-body font-sans"> vs last month</span>
 </span>
 )}
 </div>
 </div>

 <div className="cb-card p-8">
 <p className="cb-caption">High risk</p>
 <p className="mt-4 text-5xl font-mono font-medium text-nexus-red">{data.highRiskEmployees.length}</p>
 <p className="cb-body text-sm mt-4">Employees flagged</p>
 </div>

 <div className="cb-card p-8">
 <p className="cb-caption">Prevention ROI</p>
 <p className="mt-4 text-5xl font-mono font-medium text-nexus-green">{data.costPreventionROI}</p>
 <p className="cb-body text-sm mt-4">Estimated savings</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="cb-card p-8">
 <div className="mb-6">
 <p className="cb-caption mb-2">Departments</p>
 <h2 className="cb-h2">Fatigue distribution</h2>
 </div>

 {data.departmentFatigue.length > 0 ? (
 <ResponsiveContainer width="100%" height={260}>
 <BarChart data={data.departmentFatigue}>
 <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
 <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
 <Tooltip contentStyle={tooltipStyle} />
 <Bar dataKey="value" fill="#0052ff" />
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <p className="cb-body text-sm">No department data.</p>
 )}

 {data.departmentFatigue.length > 0 && (
 <div className="mt-6 space-y-3">
 {data.departmentFatigue.map((d) => (
 <div key={d.name} className="flex items-center justify-between">
 <span className="cb-body text-sm">{d.name}</span>
 <span className={`text-sm font-mono ${tierText(d.tier)}`}>{d.value}%</span>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="cb-card p-8">
 <div className="mb-6">
 <p className="cb-caption mb-2">People</p>
 <h2 className="cb-h2">High risk employees</h2>
 </div>

 <div className="space-y-3 max-h-96 overflow-y-auto">
 {data.highRiskEmployees.map((emp) => (
 <div key={emp.id} className="border border-border rounded-2xl p-5">
 <div className="flex items-center justify-between gap-3 mb-3">
 <span className="font-semibold text-foreground">{emp.name || 'Unknown employee'}</span>
 <span className="cb-pill">{emp.riskTier}</span>
 </div>
 <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border mb-3">
 <div className="h-full" style={{ width: `${emp.riskScore}%`, backgroundColor: 'hsl(var(--primary))' }} />
 </div>
 {emp.signals.map((s, i) => (
 <p key={i} className="cb-body text-sm">
 • {s}
 </p>
 ))}
 </div>
 ))}
 {data.highRiskEmployees.length === 0 && (
 <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
 No high-risk employees.
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default HRBurnoutRadar;

