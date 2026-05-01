/**
 * Action Center — HR approval workflow for staffing and team requests
 */
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import type { EmployeeRequest, MembershipRequest } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const TeamRequests: React.FC = () => {
 const navigate = useNavigate();
 const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
 const [employeeRequests, setEmployeeRequests] = useState<EmployeeRequest[]>([]);
 const [loading, setLoading] = useState(true);
 const [actionId, setActionId] = useState<string | null>(null);

 const fetchRequests = async () => {
 const [teamRes, employeeRes] = await Promise.all([api.getPendingRequests(), api.getEmployeeRequests()]);
 if (teamRes.success) setMembershipRequests(teamRes.requests);
 if (employeeRes.success) setEmployeeRequests(employeeRes.requests);
 setLoading(false);
 };

 useEffect(() => {
 void fetchRequests();
 }, []);

 const staffingQueue = useMemo(
 () => employeeRequests.filter((request) => request.status === 'Pending' || request.status === 'Approved'),
 [employeeRequests],
 );

 const handleApproveEmployee = async (id: string) => {
 const note = prompt('Optional approval note:') || undefined;
 setActionId(id);
 const res = await api.approveEmployeeRequest(id, note);
 setActionId(null);
 if (res.success) navigate(`/hr/employees?requestId=${id}`);
 };

 const handleRejectEmployee = async (id: string) => {
 const note = prompt('Denial reason:');
 if (!note) return;
 setActionId(id);
 const res = await api.denyEmployeeRequest(id, note);
 if (res.success) {
 setEmployeeRequests((prev) =>
 prev.map((request) => (request.requestId === id ? { ...request, status: 'Denied', reviewNote: note } : request)),
 );
 }
 setActionId(null);
 };

 const handleApproveMembership = async (id: string) => {
 setActionId(id);
 const res = await api.approveMembership(id);
 if (res.success) setMembershipRequests((prev) => prev.filter((r) => r.membershipId !== id));
 setActionId(null);
 };

 const handleRejectMembership = async (id: string) => {
 const note = prompt('Rejection reason (optional):') || undefined;
 setActionId(id);
 const res = await api.rejectMembership(id, note);
 if (res.success) setMembershipRequests((prev) => prev.filter((r) => r.membershipId !== id));
 setActionId(null);
 };

 if (loading) return <LoadingSpinner message="Loading requests…" />;

 return (
 <div className="cb-page">
 <div className="cb-page-header">
 <div>
 <h1 className="cb-h1">Action center</h1>
 <p className="cb-subtitle mt-3">
 <span className="font-mono">{staffingQueue.length}</span> staffing request{staffingQueue.length !== 1 ? 's' : ''} •{' '}
 <span className="font-mono">{membershipRequests.length}</span> team approval{membershipRequests.length !== 1 ? 's' : ''}
 </p>
 </div>
 </div>

 <section className="space-y-4">
 <div>
 <p className="cb-caption mb-2">Staffing</p>
 <h2 className="cb-h2">Manager staffing requests</h2>
 </div>

 {staffingQueue.length === 0 ? (
 <div className="cb-card p-10 text-center">
 <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
 <p className="cb-body">No staffing requests in the queue.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {staffingQueue.map((request) => (
 <div key={request.requestId} className="cb-card p-6">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="flex-1">
 <div className="mb-3 flex flex-wrap items-center gap-2">
 <span className="cb-pill">{request.status === 'Pending' && request.viewedAt ? 'Viewed' : request.status}</span>
 <span className="cb-pill capitalize">{request.priority}</span>
 <span className="text-xs cb-body">{new Date(request.createdAt).toLocaleDateString()}</span>
 </div>

 <p className="text-foreground font-semibold">Requested role: {request.requestedRole}</p>
 <p className="cb-body text-sm mt-1">
 Skills required: <span className="font-mono">{request.skillsRequired.length}</span>
 </p>
 {request.skillsRequired.length > 0 && (
 <p className="cb-body text-sm mt-2">
 {request.skillsRequired.slice(0, 3).map((s) => s.skill_name).join(', ')}
 {request.skillsRequired.length > 3 ? '…' : ''}
 </p>
 )}
 {request.reviewNote && <p className="cb-body text-sm mt-3">Review note: “{request.reviewNote}”</p>}
 </div>

 {request.status === 'Pending' ? (
 <div className="flex flex-wrap gap-2">
 <button onClick={() => handleApproveEmployee(request.requestId)} disabled={actionId === request.requestId} className="cb-btn-primary">
 {actionId === request.requestId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
 Approve & create
 </button>
 <button onClick={() => handleRejectEmployee(request.requestId)} disabled={actionId === request.requestId} className="cb-btn-secondary">
 <XCircle className="h-4 w-4" />
 Deny
 </button>
 </div>
 ) : (
 <span className="cb-body text-sm">
 Approved{request.createdEmployeeId ? ` (Employee ID: ${request.createdEmployeeId})` : ''}.
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </section>

 <section className="space-y-4">
 <div>
 <p className="cb-caption mb-2">Teams</p>
 <h2 className="cb-h2">Pending team membership requests</h2>
 </div>

 {membershipRequests.length === 0 ? (
 <div className="cb-card p-10 text-center">
 <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
 <p className="cb-body">No pending team requests.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {membershipRequests.map((req) => (
 <div key={req.membershipId} className="cb-card p-6">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="flex-1">
 <div className="mb-3 flex items-center gap-2">
 <span className="cb-pill">Pending</span>
 <span className="text-xs cb-body">{new Date(req.createdAt).toLocaleDateString()}</span>
 </div>
 <p className="text-foreground font-semibold">{req.employeeName}</p>
 <p className="cb-body text-sm mt-1">
 {req.department} • {req.seniorityLevel} → Team: {req.teamName}
 </p>
 {req.requestReason && <p className="cb-body text-sm mt-3">“{req.requestReason}”</p>}
 </div>
 <div className="flex gap-2">
 <button onClick={() => handleApproveMembership(req.membershipId)} disabled={actionId === req.membershipId} className="cb-btn-primary">
 {actionId === req.membershipId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
 Approve
 </button>
 <button onClick={() => handleRejectMembership(req.membershipId)} disabled={actionId === req.membershipId} className="cb-btn-secondary">
 <XCircle className="h-4 w-4" />
 Reject
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </section>
 </div>
 );
};

export default TeamRequests;

