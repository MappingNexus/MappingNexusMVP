/**
 * Action Center — HR approval workflow for staffing and team requests
 */
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import type { MembershipRequest, EmployeeRequest } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const TeamRequests: React.FC = () => {
    const navigate = useNavigate();
    const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
    const [employeeRequests, setEmployeeRequests] = useState<EmployeeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        const [teamRes, employeeRes] = await Promise.all([
            api.getPendingRequests(),
            api.getEmployeeRequests(),
        ]);
        if (teamRes.success) setMembershipRequests(teamRes.requests);
        if (employeeRes.success) setEmployeeRequests(employeeRes.requests);
        setLoading(false);
    };

    const handleApproveEmployee = async (id: string) => {
        const note = prompt('Optional approval note:');
        setActionId(id);
        const res = await api.approveEmployeeRequest(id, note || undefined);
        setActionId(null);
        if (res.success) {
            navigate(`/hr/employees?requestId=${id}`);
        }
    };

    const handleRejectEmployee = async (id: string) => {
        const note = prompt('Denial reason:');
        if (!note) return;
        setActionId(id);
        const res = await api.denyEmployeeRequest(id, note);
        if (res.success) setEmployeeRequests(prev => prev.map(request => request.requestId === id ? { ...request, status: 'Denied', reviewNote: note } : request));
        setActionId(null);
    };

    const handleApproveMembership = async (id: string) => {
        setActionId(id);
        const res = await api.approveMembership(id);
        if (res.success) setMembershipRequests(prev => prev.filter(r => r.membershipId !== id));
        setActionId(null);
    };

    const handleRejectMembership = async (id: string) => {
        const note = prompt('Rejection reason (optional):');
        setActionId(id);
        const res = await api.rejectMembership(id, note || undefined);
        if (res.success) setMembershipRequests(prev => prev.filter(r => r.membershipId !== id));
        setActionId(null);
    };

    if (loading) return <LoadingSpinner message="Loading requests..." />;

    const staffingQueue = employeeRequests.filter(request => request.status === 'Pending' || request.status === 'Approved');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Action Center</h1>
                <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">{staffingQueue.length} staffing request{staffingQueue.length !== 1 ? 's' : ''} • {membershipRequests.length} team approval{membershipRequests.length !== 1 ? 's' : ''}</p>
            </div>

            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500 dark:text-[#00FF66]" />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Manager Staffing Requests</h2>
                </div>

                {staffingQueue.length === 0 ? (
                    <div className="border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
                        <Clock className="mx-auto mb-3 h-12 w-12 text-gray-500 dark:text-[#8a8a8a]" />
                        <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">➔ No manager staffing requests in the queue.</p>
                    </div>
                ) : staffingQueue.map(request => (
                    <div key={request.requestId} className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f] p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className={`border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${request.status === 'Approved' ? 'border-blue-500 dark:border-[#00FF66]/30 text-blue-500 dark:text-[#00FF66] bg-[#00FF66]/10' : request.viewedAt ? 'border-[#FF9900]/30 text-[#FF9900] bg-[#FF9900]/10' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-[#8a8a8a]'}`}>
                                        {request.status === 'Pending' && request.viewedAt ? 'Viewed' : request.status}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] font-mono">{request.priority}</span>
                                    <span className="text-xs text-gray-500 dark:text-[#8a8a8a] font-mono">{new Date(request.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white uppercase">{request.requestedRole}</p>
                                <p className="mt-2 text-sm text-gray-500 dark:text-[#8a8a8a]">{request.skillsRequired.map(skill => `${skill.skill_name} (${skill.count})`).join(', ') || 'No skills supplied'}</p>
                                {request.reviewNote && <p className="mt-2 text-sm italic text-gray-500 dark:text-[#8a8a8a]">"{request.reviewNote}"</p>}
                            </div>
                            {request.status === 'Pending' ? (
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => handleApproveEmployee(request.requestId)} disabled={actionId === request.requestId} className="inline-flex items-center gap-1.5 bg-white text-black font-bold uppercase tracking-widest text-xs px-4 py-2 hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        {actionId === request.requestId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve & Create
                                    </button>
                                    <button onClick={() => handleRejectEmployee(request.requestId)} disabled={actionId === request.requestId} className="inline-flex items-center gap-1.5 border border-[#FF3333]/30 text-[#FF3333] hover:bg-[#FF3333]/10 uppercase tracking-widest text-xs px-4 py-2 transition-colors disabled:opacity-50">
                                        <XCircle className="h-4 w-4" /> Deny
                                    </button>
                                </div>
                            ) : (
                                <span className="text-sm text-blue-500 dark:text-[#00FF66] font-mono">Approved and ready for employee creation</span>
                            )}
                        </div>
                    </div>
                ))}
            </section>

            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FF9900]" />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Pending Team Membership Requests</h2>
                </div>

                {membershipRequests.length === 0 ? (
                    <div className="border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
                        <Clock className="mx-auto mb-3 h-12 w-12 text-gray-500 dark:text-[#8a8a8a]" />
                        <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">➔ No pending team requests</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {membershipRequests.map(req => (
                            <div key={req.membershipId} className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f] p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="border border-[#FF9900]/30 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#FF9900] bg-[#FF9900]/10">Pending</span>
                                            <span className="text-xs text-gray-500 dark:text-[#8a8a8a] font-mono">{new Date(req.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white uppercase">{req.employeeName}</p>
                                        <p className="text-sm text-gray-500 dark:text-[#8a8a8a]">{req.department} • {req.seniorityLevel} → Team: {req.teamName}</p>
                                        {req.requestReason && <p className="mt-2 text-sm italic text-gray-500 dark:text-[#8a8a8a]">"{req.requestReason}"</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleApproveMembership(req.membershipId)} disabled={actionId === req.membershipId} className="inline-flex items-center gap-1.5 bg-white text-black font-bold uppercase tracking-widest text-xs px-4 py-2 hover:bg-gray-200 transition-colors disabled:opacity-50">
                                            {actionId === req.membershipId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve
                                        </button>
                                        <button onClick={() => handleRejectMembership(req.membershipId)} disabled={actionId === req.membershipId} className="inline-flex items-center gap-1.5 border border-[#FF3333]/30 text-[#FF3333] hover:bg-[#FF3333]/10 uppercase tracking-widest text-xs px-4 py-2 transition-colors disabled:opacity-50">
                                            <XCircle className="h-4 w-4" /> Reject
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
