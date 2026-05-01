/**
 * HR Skill Pulse — analytics/skills
 */
import React, { useEffect, useState } from 'react';
import * as api from '../../services/api';
import type { SkillPulseData } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const HRSkillPulse: React.FC = () => {
 const [data, setData] = useState<SkillPulseData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 let isActive = true;
 const loadSkillPulse = async () => {
 const response = await api.getSkillPulse();
 if (!isActive) return;
 if (response.success) {
 setData(response.data);
 setError(null);
 } else {
 setData(null);
 setError(api.getErrorMessage(response, 'Failed to load skill data.'));
 }
 setLoading(false);
 };
 void loadSkillPulse();
 return () => {
 isActive = false;
 };
 }, []);

 if (loading) return <LoadingSpinner message="Loading skill pulse…" />;
 if (!data) return <p className="text-muted-foreground text-sm">{error || 'Failed to load skill data.'}</p>;

 return (
 <div className="cb-page">
 <div className="cb-page-header">
 <div>
 <h1 className="cb-h1">Skill pulse</h1>
 <p className="cb-subtitle mt-3">Talent density, trending movement, dormant inventory, and gaps.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="cb-card p-8">
 <div className="mb-6">
 <p className="cb-caption mb-2">Inventory</p>
 <h2 className="cb-h2">Top skills</h2>
 <p className="cb-body text-sm mt-2">
 <span className="font-mono">{data.topSkills.length}</span> skills ranked by demand score.
 </p>
 </div>
 <div className="space-y-5">
 {data.topSkills.map((s) => (
 <div key={s.name}>
 <div className="flex justify-between items-baseline gap-3 text-sm mb-2">
 <span className="text-foreground font-medium">{s.name}</span>
 <span className="cb-body">
 <span className="font-mono">{s.employeeCount}</span> employees
 </span>
 </div>
 <div className="bg-muted h-2 rounded-full overflow-hidden border border-border">
 <div className="h-full" style={{ width: `${s.demandScore}%`, backgroundColor: 'hsl(var(--primary))' }} />
 </div>
 </div>
 ))}
 {data.topSkills.length === 0 && <p className="cb-body text-sm">No skills yet.</p>}
 </div>
 </div>

 <div className="cb-card p-8">
 <div className="mb-6">
 <p className="cb-caption mb-2">Momentum</p>
 <h2 className="cb-h2">Trending skills</h2>
 </div>
 <div className="space-y-3">
 {data.trendingSkills.map((s) => (
 <div key={s.name} className="border border-border rounded-2xl p-5 flex items-center justify-between">
 <span className="text-foreground font-medium">{s.name}</span>
 <span className="font-mono text-sm text-nexus-green">{s.growthPercent}</span>
 </div>
 ))}
 {data.trendingSkills.length === 0 && (
 <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
 No trending data.
 </div>
 )}
 </div>
 </div>

 <div className="cb-card p-8">
 <div className="mb-6">
 <p className="cb-caption mb-2">Hygiene</p>
 <h2 className="cb-h2">Dormant skills</h2>
 <p className="cb-body text-sm mt-2">Unused for more than 90 days.</p>
 </div>
 <div className="divide-y divide-border">
 {data.dormantSkills.map((s) => (
 <div key={s.name} className="py-4 flex items-start justify-between gap-4">
 <div>
 <div className="text-foreground font-medium">{s.name}</div>
 <div className="cb-body text-sm mt-1">
 <span className="font-mono">{s.employeeCount}</span> employees • avg <span className="font-mono">{s.avgDaysSinceUsed}d</span>
 </div>
 </div>
 <span className="cb-pill">Dormant</span>
 </div>
 ))}
 {data.dormantSkills.length === 0 && <p className="cb-body text-sm py-4">No dormant skills.</p>}
 </div>
 </div>

 <div className="cb-card p-8">
 <div className="mb-6">
 <p className="cb-caption mb-2">Capacity</p>
 <h2 className="cb-h2">Skill gaps</h2>
 </div>
 <div className="space-y-5">
 {data.skillGaps.map((g) => (
 <div key={g.name}>
 <div className="flex justify-between items-baseline gap-3 text-sm mb-2">
 <span className="text-foreground font-medium">{g.name}</span>
 <span className="cb-body">
 Gap: <span className="font-mono">{g.gap}</span>
 </span>
 </div>
 <div className="bg-muted h-2 rounded-full overflow-hidden border border-border">
 <div
 className="h-full"
 style={{ width: `${Math.min(100, (g.gap / Math.max(1, g.total)) * 100)}%`, backgroundColor: '#cf202f' }}
 />
 </div>
 </div>
 ))}
 {data.skillGaps.length === 0 && (
 <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
 No skill gaps detected.
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default HRSkillPulse;

