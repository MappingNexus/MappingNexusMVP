/**
 * Audit Log — HR only, paginated view of all company actions.
 */
import React, { useEffect, useState } from 'react';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../../services/api';
import type { AuditLogEntry } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const PAGE_SIZE = 25;

const AuditLog: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => { fetchLogs(); }, [offset, filter]);

    const fetchLogs = async () => {
        setLoading(true);
        const res = await api.getAuditLogs({ limit: PAGE_SIZE, offset, action: filter || undefined });
        if (res.success) { setLogs(res.logs); setTotal(res.total); }
        setLoading(false);
    };

    const actionColor = (a: string) => {
        if (a.includes('blocked') || a.includes('unauthorized')) return 'text-nexus-red bg-nexus-red/10 border-nexus-red/20';
        if (a.includes('created') || a.includes('approved')) return 'text-nexus-green bg-nexus-green/10 border-nexus-green/20';
        if (a.includes('rejected') || a.includes('archived')) return 'text-nexus-orange bg-nexus-orange/10 border-nexus-orange/20';
        return 'text-nexus-purple bg-nexus-purple/10 border-nexus-purple/20';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Append-only action trail</p>
                </div>
                <select value={filter} onChange={e => { setFilter(e.target.value); setOffset(0); }}
                    className="bg-transparent border border-border px-4 py-2 text-foreground text-sm outline-none focus:border-ring transition-colors">
                    <option value="">All Actions</option>
                    <option value="employee_created">Employee Created</option>
                    <option value="employee_edited">Employee Edited</option>
                    <option value="employee_archived">Employee Archived</option>
                    <option value="team_request_approved">Team Approved</option>
                    <option value="team_request_rejected">Team Rejected</option>
                    <option value="match_query_executed">Match Query</option>
                    <option value="user_login">Login</option>
                    <option value="cross_tenant_access_blocked">Security Event</option>
                </select>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="bg-card border border-border overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-border">
                            {['Time', 'Action', 'Actor Role', 'Target', 'Details'].map(h => (
                                <th key={h} className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-5 py-3">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.log_id} className="border-b border-border/50 hover:bg-accent/30">
                                    <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="px-5 py-3"><span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 border ${actionColor(log.action)}`}>{log.action}</span></td>
                                    <td className="px-5 py-3 text-sm text-muted-foreground capitalize">{log.actor_role}</td>
                                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{log.target_id?.substring(0, 8) || '—'}</td>
                                    <td className="px-5 py-3 text-xs text-muted-foreground max-w-xs truncate font-mono">{JSON.stringify(log.metadata).substring(0, 80)}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">➔ No audit logs found</td></tr>}
                        </tbody>
                    </table>

                    {total > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                            <p className="text-xs text-muted-foreground font-mono">Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
                                    className="p-1.5 bg-card/80 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
                                    className="p-1.5 bg-card/80 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuditLog;
