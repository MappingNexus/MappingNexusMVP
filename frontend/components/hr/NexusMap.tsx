/**
 * Nexus Map — HR dashboard overview
 */
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import * as api from '../../services/api';
import type { AnalyticsOverview } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const NexusMap: React.FC = () => {
 const [data, setData] = useState<AnalyticsOverview | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const [projects, setProjects] = useState<any[]>([]);

 const fetchData = async () => {
 setLoading(true);
 setError(null);
 const res = await api.getAnalyticsOverview();
 if (res.success) {
 setData(res.data);
 } else {
 setData(null);
 setError(api.getErrorMessage(res, 'Failed to load analytics.'));
 }
 setLoading(false);
 };

 useEffect(() => {
 void fetchData();
 }, []);

 useEffect(() => {
 let isActive = true;
 const loadProjects = async () => {
 const response = await api.getProjects();
 if (!isActive) return;
 if (response.success) setProjects(response.projects);
 else setProjects([]);
 };
 void loadProjects();
 return () => {
 isActive = false;
 };
 }, []);

 const currentTimestamp = useMemo(() => new Date().toLocaleString(), []);
 const activeProjects = projects.filter((project) => project.status !== 'completed').length;

 if (loading) {
 return (
 <div className="flex items-center justify-center h-full min-h-[50vh]">
 <LoadingSpinner message="Syncing data…" />
 </div>
 );
 }

 if (!data) return <p className="text-muted-foreground text-sm">{error || 'Failed to load analytics.'}</p>;

 return (
 <div className="cb-page">
 <div className="cb-page-header">
 <div>
 <h1 className="cb-h1">Nexus overview</h1>
 <p className="cb-subtitle mt-3">
 Organization-wide snapshot of capacity, risk signals, and project activity.
 </p>
 <div className="cb-meta mt-4">
 <span className="font-mono">{data.totalEmployees}</span>
 <span>employees</span>
 <span className="text-border">•</span>
 <span>Viewed {currentTimestamp}</span>
 <span className="text-border">•</span>
 <span className="inline-flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-success" />
 Live
 </span>
 </div>
 </div>
 <button onClick={fetchData} className="cb-btn-secondary">
 <RefreshCw className="w-4 h-4" />
 Sync data
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 <div className="cb-card p-8">
 <p className="cb-caption">Node count</p>
 <p className="mt-4 text-5xl font-mono font-medium text-foreground">{data.totalEmployees}</p>
 <p className="cb-body text-sm mt-4">Active + bench headcount</p>
 </div>
 <div className="cb-card p-8">
 <p className="cb-caption">Risk signals</p>
 <p className="mt-4 text-5xl font-mono font-medium text-nexus-red">{data.burnoutRiskCount}</p>
 <p className="cb-body text-sm mt-4">Employees currently flagged</p>
 </div>
 <div className="cb-card p-8">
 <p className="cb-caption">Health score</p>
 <p className="mt-4 text-5xl font-mono font-medium text-foreground">{data.healthScore}%</p>
 <p className="cb-body text-sm mt-4">Workforce load health snapshot</p>
 </div>
 <div className="cb-card p-8">
 <p className="cb-caption">Active projects</p>
 <p className="mt-4 text-5xl font-mono font-medium text-foreground">{activeProjects}</p>
 <p className="cb-body text-sm mt-4">Live company projects</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="cb-card p-8">
 <div className="flex justify-between items-start mb-8 gap-4">
 <div>
 <p className="cb-caption mb-2">Department load</p>
 <h2 className="cb-h2">Department breakdown</h2>
 </div>
 <span className="cb-pill">
 <span className="font-mono">{data.departmentBreakdown.length}</span>&nbsp;departments
 </span>
 </div>

 <div className="space-y-4">
 {data.departmentBreakdown.length > 0 ? (
 data.departmentBreakdown.map((department) => (
 <div key={department.name} className="border border-border rounded-2xl p-5">
 <div className="flex items-center justify-between gap-3 text-sm text-foreground">
 <span className="font-semibold">{department.name}</span>
 <span className="cb-body">
 <span className="font-mono">{department.count}</span> people
 </span>
 </div>
 <div className="mt-3 flex items-center justify-between gap-3 text-sm">
 <span className="cb-body">
 Avg load <span className="font-mono">{(department.avgLoad ?? 0).toFixed(1)}</span>
 </span>
 <span className="cb-body">
 <span className="font-mono">{department.burnoutRisk}</span> at risk
 </span>
 </div>
 </div>
 ))
 ) : (
 <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
 No department data available.
 </div>
 )}
 </div>
 </div>

 <div className="cb-card p-8">
 <div className="flex justify-between items-start mb-8 gap-4">
 <div>
 <p className="cb-caption mb-2">Project pipeline</p>
 <h2 className="cb-h2">Live projects</h2>
 </div>
 <span className="cb-pill">
 <span className="font-mono">{projects.length}</span>&nbsp;total
 </span>
 </div>
 <div className="space-y-4">
 {projects.length > 0 ? (
 projects.slice(0, 6).map((project) => (
 <div key={project.project_id} className="border border-border rounded-2xl p-5">
 <div className="flex items-center justify-between gap-4">
 <div>
 <p className="text-foreground font-semibold">{project.project_name}</p>
 <p className="cb-body text-sm mt-2">
 {project.start_date ? `Start ${new Date(project.start_date).toLocaleDateString()}` : 'Start TBD'}
 </p>
 </div>
 <span className="cb-pill">{project.status || 'planned'}</span>
 </div>
 </div>
 ))
 ) : (
 <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
 No projects configured yet.
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="mt-2 border-t border-border pt-10">
 <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
 <div>
 <p className="cb-caption mb-2">Nexus map</p>
 <h2 className="cb-h2">Workforce nodes</h2>
 </div>
 <div className="flex items-center gap-4 text-sm cb-body">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-nexus-green" /> Healthy
 </div>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-nexus-orange" /> Watch
 </div>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-nexus-red" /> At risk
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {data.utilizationHeatmap.length > 0 ? (
 data.utilizationHeatmap.map((node, i) => {
 const statusColor = node.tier === 'red' ? '#FF3333' : node.tier === 'yellow' ? '#FF9900' : '#00FF66';
 const initials = (node.name || '??')
 .split(' ')
 .map((n: string) => n[0])
 .join('')
 .substring(0, 2)
 .toUpperCase();

 return (
 <div key={i} className="cb-card p-6 relative">
 <div className="absolute top-6 right-6 w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />

 <div className="w-12 h-12 bg-muted text-foreground flex items-center justify-center text-lg font-mono font-medium mb-4 rounded-full border border-border">
 {initials}
 </div>

 <h3 className="text-foreground font-semibold text-sm truncate">{node.name || 'Unknown employee'}</h3>
 <div className="cb-body text-sm mt-1 mb-6">{node.department || 'Engineering'}</div>

 <div className="mt-auto w-full">
 <div className="w-full flex justify-between items-end text-sm mb-2">
 <span className="cb-body">Utilization</span>
 <span className="font-mono" style={{ color: statusColor }}>
 {node.utilization}%
 </span>
 </div>
 <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
 <div className="h-full transition-all duration-500" style={{ width: `${node.utilization}%`, backgroundColor: statusColor }} />
 </div>
 </div>
 </div>
 );
 })
 ) : (
 <div className="col-span-full py-16 text-center text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
 No nodes detected.
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default NexusMap;

