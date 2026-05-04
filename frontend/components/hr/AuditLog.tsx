/**
 * Audit Log — HR only, paginated view of company actions.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

 const fetchLogs = async () => {
 setLoading(true);
 const res = await api.getAuditLogs({ limit: PAGE_SIZE, offset, action: filter || undefined });
 if (res.success) {
 setLogs(res.logs);
 setTotal(res.total);
 }
 setLoading(false);
 };

 useEffect(() => {
 void fetchLogs();
 }, [offset, filter]);

 const showingTo = useMemo(() => Math.min(offset + PAGE_SIZE, total), [offset, total]);

 const actionPillClass = (action: string) => {
 if (action.includes('blocked') || action.includes('unauthorized')) return 'text-nexus-red border-nexus-red/20 bg-nexus-red/10';
 if (action.includes('created') || action.includes('approved')) return 'text-nexus-green border-nexus-green/20 bg-nexus-green/10';
 if (action.includes('rejected') || action.includes('archived')) return 'text-nexus-orange border-nexus-orange/20 bg-nexus-orange/10';
 return 'text-nexus-purple border-nexus-purple/20 bg-nexus-purple/10';
 };

 return (
 <div className="cb-page">
 <div className="cb-page-header">
 <div>
 <h1 className="cb-h1">Audit log</h1>
 <p className="cb-subtitle mt-3">Append-only trail of meaningful actions across the workspace.</p>
 </div>
 <select
 value={filter}
 onChange={(e) => {
 setFilter(e.target.value);
 setOffset(0);
 }}
 className="cb-input h-11 w-full sm:w-[260px]"
 >
 <option value="">All actions</option>
 <option value="employee_created">Employee created</option>
 <option value="employee_edited">Employee edited</option>
 <option value="employee_archived">Employee archived</option>
 <option value="team_request_approved">Team approved</option>
 <option value="team_request_rejected">Team rejected</option>
 <option value="match_query_executed">Match query</option>
 <option value="user_login">Login</option>
 <option value="cross_tenant_access_blocked">Security event</option>
 </select>
 </div>

 {loading ? (
 <LoadingSpinner />
 ) : (
 <div className="cb-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="cb-table">
 <thead>
 <tr>
 {['Time', 'Action', 'Actor role', 'Target', 'Details'].map((h) => (
 <th key={h}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {logs.map((log) => (
 <tr key={log.log_id}>
 <td className="text-sm cb-body whitespace-nowrap font-mono">{new Date(log.created_at).toLocaleString()}</td>
 <td>
 <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${actionPillClass(log.action)}`}>
 {log.action}
 </span>
 </td>
 <td className="text-sm cb-body capitalize">{log.actor_role}</td>
 <td className="text-sm cb-body font-mono">{log.target_id?.substring(0, 8) || '—'}</td>
 <td className="text-sm cb-body max-w-md truncate font-mono">{JSON.stringify(log.metadata).substring(0, 120)}</td>
 </tr>
 ))}
 {logs.length === 0 && (
 <tr>
 <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground text-sm">
 No audit logs found.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {total > PAGE_SIZE && (
 <div className="flex items-center justify-between px-5 py-4 border-t border-border">
 <p className="text-sm cb-body">
 Showing <span className="font-mono">{offset + 1}</span>–<span className="font-mono">{showingTo}</span> of{' '}
 <span className="font-mono">{total}</span>
 </p>
 <div className="flex gap-2">
 <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0} className="cb-btn-secondary h-11 w-11 px-0">
 <ChevronLeft className="w-4 h-4" />
 </button>
 <button
 onClick={() => setOffset(offset + PAGE_SIZE)}
 disabled={offset + PAGE_SIZE >= total}
 className="cb-btn-secondary h-11 w-11 px-0"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
};

export default AuditLog;

