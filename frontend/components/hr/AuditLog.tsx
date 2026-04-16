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
        if (a.includes('blocked') || a.includes('unauthorized')) return 'text-[#FF3333] bg-[#FF3333]/10 border-[#FF3333]/20';
        if (a.includes('created') || a.includes('approved')) return 'text-blue-500 dark:text-[#00FF66] bg-[#00FF66]/10 border-blue-500 dark:border-[#00FF66]/20';
        if (a.includes('rejected') || a.includes('archived')) return 'text-[#FF9900] bg-[#FF9900]/10 border-[#FF9900]/20';
        return 'text-[#9D4EDD] bg-[#9D4EDD]/10 border-[#9D4EDD]/20';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Audit Log</h1>
                    <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">Append-only action trail</p>
                </div>
                <select value={filter} onChange={e => { setFilter(e.target.value); setOffset(0); }}
                    className="bg-transparent border border-gray-200 dark:border-white/10 px-4 py-2 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors">
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
                <div className="bg-[#111111] border border-gray-200 dark:border-white/10 overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-gray-200 dark:border-white/10">
                            {['Time', 'Action', 'Actor Role', 'Target', 'Details'].map(h => (
                                <th key={h} className="text-left font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] px-5 py-3">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.log_id} className="border-b border-gray-200 dark:border-white/10/50 hover:bg-white/[0.02]">
                                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-[#8a8a8a] whitespace-nowrap font-mono">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="px-5 py-3"><span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 border ${actionColor(log.action)}`}>{log.action}</span></td>
                                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-[#8a8a8a] capitalize">{log.actor_role}</td>
                                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-[#8a8a8a] font-mono">{log.target_id?.substring(0, 8) || '—'}</td>
                                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-[#8a8a8a] max-w-xs truncate font-mono">{JSON.stringify(log.metadata).substring(0, 80)}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">➔ No audit logs found</td></tr>}
                        </tbody>
                    </table>

                    {total > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-white/10">
                            <p className="text-xs text-gray-500 dark:text-[#8a8a8a] font-mono">Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
                                    className="p-1.5 bg-white/80 dark:bg-[#1a1a1c]/80 backdrop-blur-md border border-gray-200 dark:border-white/10 text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
                                    className="p-1.5 bg-white/80 dark:bg-[#1a1a1c]/80 backdrop-blur-md border border-gray-200 dark:border-white/10 text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuditLog;
