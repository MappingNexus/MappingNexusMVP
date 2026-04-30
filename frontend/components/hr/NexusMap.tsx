/**
 * Nexus Map (Command Center)
 * Updated for Mapping Nexus Command Center UI Specs
 */
import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import * as api from '../../services/api';
import type { AnalyticsOverview } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const NexusMap: React.FC = () => {
    const [data, setData] = useState<AnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { void fetchData(); }, []);
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

    // Kept to preserve logic
    const [projects, setProjects] = useState<any[]>([]);
    useEffect(() => {
        let isActive = true;

        const loadProjects = async () => {
            const response = await api.getProjects();
            if (!isActive) return;

            if (response.success) {
                setProjects(response.projects);
            } else {
                setProjects([]);
            }
        };

        void loadProjects();

        return () => {
            isActive = false;
        };
    }, []);
    const currentTimestamp = new Date().toLocaleString();
    const activeProjects = projects.filter(project => project.status !== 'completed').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <LoadingSpinner message="SYNCING WITH NEXUS..." />
            </div>
        );
    }
    
    if (!data) return <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">{error || 'Failed to load analytics.'}</p>;

    return (
        <div className="flex flex-col gap-12 pb-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-border pb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">NEXUS COMMAND CENTER</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-4 font-mono text-muted-foreground text-xs uppercase tracking-widest">
                        <span>{data.totalEmployees} EMPLOYEES</span>
                        <span className="text-border">//</span>
                        <span>[ VIEWED {currentTimestamp} ]</span>
                        <span className="text-border">//</span>
                        <div className="flex items-center gap-2 text-nexus-green">
                            <div className="w-2 h-2 rounded-full bg-nexus-green animate-pulse"></div>
                            LIVE
                        </div>
                    </div>
                </div>
                <button 
                    onClick={fetchData}
                    className="flex items-center justify-center gap-2 border border-border bg-card/50 backdrop-blur-md hover:bg-accent text-foreground px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    SYNC DATA
                </button>
            </div>

            {/* Key Metrics Row (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
                {/* NODE COUNT */}
                <div className="bg-card/50 backdrop-blur-md border-r border-b lg:border-b-0 border-border p-6 lg:p-8">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">[ NODE.COUNT ]</p>
                    <p className="text-5xl font-black text-foreground mt-4">{data.totalEmployees}</p>
                    <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-4">➔ ACTIVE + BENCH HEADCOUNT</p>
                </div>
                {/* RISK SIGNALS */}
                <div className="bg-card/50 backdrop-blur-md border-b sm:border-r sm:border-b-0 lg:border-b-0 border-border p-6 lg:p-8">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">[ RISK.SIGNALS ]</p>
                    <p className="text-5xl font-black text-nexus-red mt-4">{data.burnoutRiskCount}</p>
                    <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-4">➔ EMPLOYEES CURRENTLY FLAGGED</p>
                </div>
                {/* HEALTH SCORE */}
                <div className="bg-card/50 backdrop-blur-md border-r border-border p-6 lg:p-8">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">[ HEALTH.SCORE ]</p>
                    <p className="text-5xl font-black text-foreground mt-4">{data.healthScore}%</p>
                    <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-4">➔ WORKFORCE LOAD HEALTH SNAPSHOT</p>
                </div>
                {/* ACTIVE PROJECTS */}
                <div className="bg-card/50 backdrop-blur-md p-6 lg:p-8">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">[ ACTIVE.PROJECTS ]</p>
                    <p className="text-5xl font-black text-foreground mt-4">{activeProjects}</p>
                    <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-4">➔ LIVE COMPANY PROJECTS</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card/50 backdrop-blur-md border border-border p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="font-mono text-muted-foreground text-[10px] uppercase tracking-widest mb-1">[ DEPARTMENT.LOAD ]</p>
                            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Department Breakdown</h2>
                        </div>
                        <span className="text-muted-foreground border border-border px-3 py-1 text-[10px] font-mono uppercase tracking-widest">{data.departmentBreakdown.length} DEPARTMENTS</span>
                    </div>
                    <div className="space-y-4">
                        {data.departmentBreakdown.length > 0 ? data.departmentBreakdown.map((department) => (
                            <div key={department.name} className="border border-border p-4">
                                <div className="flex items-center justify-between text-sm text-foreground">
                                    <span className="font-bold uppercase tracking-wide">{department.name}</span>
                                    <span>{department.count} people</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                    <span>AVG LOAD {(department.avgLoad ?? 0).toFixed(1)}</span>
                                    <span>{department.burnoutRisk} AT RISK</span>
                                </div>
                            </div>
                        )) : (
                            <div className="border border-dashed border-border p-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                                ➔ NO DEPARTMENT DATA AVAILABLE
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md border border-border p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="font-mono text-muted-foreground text-[10px] uppercase tracking-widest mb-1">[ PROJECT.PIPELINE ]</p>
                            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Live Projects</h2>
                        </div>
                        <span className="text-muted-foreground border border-border px-3 py-1 text-[10px] font-mono uppercase tracking-widest">{projects.length} TOTAL</span>
                    </div>
                    <div className="space-y-4">
                        {projects.length > 0 ? projects.slice(0, 6).map((project) => (
                            <div key={project.project_id} className="border border-border p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-foreground font-bold uppercase tracking-wide">{project.project_name}</p>
                                        <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-2">
                                            {project.start_date ? `START ${new Date(project.start_date).toLocaleDateString()}` : 'START TBD'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest border border-border px-3 py-1 text-muted-foreground">
                                        {project.status || 'planned'}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="border border-dashed border-border p-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                                ➔ NO PROJECTS CONFIGURED YET
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Nexus Map (Nodes Grid) */}
            <div className="mt-8 border-t border-border pt-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
                    <div>
                        <p className="font-mono text-muted-foreground text-[10px] uppercase tracking-widest mb-1">[ NEXUS.MAP ]</p>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">WORKFORCE NODES</h2>
                    </div>
                    <div className="flex items-center gap-6 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-nexus-green"></div>HEALTHY</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-nexus-orange"></div>WATCH</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-nexus-red"></div>AT RISK</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {data.utilizationHeatmap.length > 0 ? data.utilizationHeatmap.map((node, i) => {
                        const statusColor = node.tier === 'red' ? '#FF3333' : node.tier === 'yellow' ? '#FF9900' : '#00FF66';
                        const initials = (node.name || '??').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                        
                        return (
                            <div key={i} className="bg-card/50 backdrop-blur-md border border-border p-5 flex flex-col hover:border-foreground/30 transition-colors relative">
                                <div className="absolute top-5 right-5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }}></div>
                                
                                <div className="w-12 h-12 bg-transparent text-foreground flex items-center justify-center text-lg font-mono font-bold mb-4 border border-border">
                                    {initials}
                                </div>
                                
                                <h3 className="text-foreground font-bold text-sm truncate uppercase tracking-wide">{node.name || 'Unknown Employee'}</h3>
                                <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest mt-1 mb-6">
                                    [ {node.department || 'ENG'} NODE ]
                                </span>
                                
                                <div className="mt-auto w-full">
                                    <div className="w-full flex justify-between items-end text-[9px] font-mono uppercase tracking-widest mb-1.5">
                                        <span className="text-muted-foreground">UTILIZATION</span>
                                        <span style={{ color: statusColor }}>{node.utilization}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-transparent border border-border overflow-hidden">
                                        <div className="h-full transition-all duration-500" style={{ width: `${node.utilization}%`, backgroundColor: statusColor }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-16 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest border border-dashed border-border">
                            ➔ NO NODES DETECTED IN SECTOR
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NexusMap;
