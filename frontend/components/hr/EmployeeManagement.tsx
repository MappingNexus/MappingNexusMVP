/**
 * Employee Management — HR CRUD + Provisioning + Bulk Import
 */
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Archive, Search, X, Loader2, Upload, Download, UserPlus } from 'lucide-react';
import * as api from '../../services/api';
import type { Employee, EmployeeRequest } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'];

const EmployeeManagement: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [inviteStatus, setInviteStatus] = useState<{ configured: boolean; message: string } | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [requestPrefill, setRequestPrefill] = useState<EmployeeRequest | null>(null);

    useEffect(() => {
        fetchEmployees();
        api.getInviteStatus().then(res => {
            if (res.success) setInviteStatus({ configured: res.configured, message: res.message });
        }).catch(() => {});
    }, [deptFilter]);

    useEffect(() => {
        const requestId = searchParams.get('requestId');
        if (!requestId) return;
        api.getEmployeeRequest(requestId).then(res => {
            if (res.success) {
                setRequestPrefill(res.request);
                setShowAdd(true);
            }
        }).catch(() => {});
    }, [searchParams]);

    const fetchEmployees = async () => {
        setLoading(true);
        const res = await api.getEmployees({ department: deptFilter || undefined });
        if (res.success) setEmployees(res.employees);
        setLoading(false);
    };

    const handleArchive = async (id: string) => {
        if (!confirm('Archive this employee? This is a soft delete.')) return;
        const res = await api.archiveEmployee(id);
        if (res.success) fetchEmployees();
    };

    const filtered = employees.filter(e =>
        (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(search.toLowerCase())
    );

    const departments = [...new Set(employees.map(e => e.department))];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Employees</h1>
                    <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">{employees.length} total across your organization</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button onClick={() => { setRequestPrefill(null); setShowAdd(true); }}
                        className="bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add Employee
                    </button>
                    <button onClick={() => setShowBulkImport(true)}
                        className="border border-[#333333] text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white hover:bg-white/80 dark:bg-[#1a1a1c]/80 backdrop-blur-md uppercase tracking-widest text-xs px-4 py-2 transition-colors flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" /> Bulk Import CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            {inviteStatus && !inviteStatus.configured && (
                <div className="bg-[#FF9900]/10 border border-[#FF9900]/20 p-4 text-sm text-[#FF9900] font-mono">
                    Invite delivery issue: {inviteStatus.message}
                </div>
            )}

            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#8a8a8a]" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or department..."
                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 pl-10 pr-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                </div>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                    className="bg-transparent border border-gray-200 dark:border-white/10 px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors">
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            {loading ? <LoadingSpinner /> :
                <div className="bg-[#111111] border border-gray-200 dark:border-white/10 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/10">
                                {['Name', 'Department', 'Seniority', 'Location', 'Load', 'Performance', 'Actions'].map(h => (
                                    <th key={h} className="text-left font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(emp => (
                                <tr key={emp.employeeId} className="border-b border-gray-200 dark:border-white/10/50 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.name || `Employee ${emp.displayId}`}</p>
                                        <p className="text-xs text-gray-500 dark:text-[#8a8a8a] font-mono">{emp.displayId}</p>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-[#8a8a8a]">{emp.department}</td>
                                    <td className="px-5 py-3"><span className="border border-[#9D4EDD]/30 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#9D4EDD] bg-[#9D4EDD]/10 capitalize">{emp.seniorityLevel}</span></td>
                                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-[#8a8a8a]">{emp.location}</td>
                                    <td className="px-5 py-3">
                                        <span className={`text-sm font-medium font-mono ${emp.currentProjectLoad >= 4 ? 'text-[#FF3333]' : emp.currentProjectLoad >= 2 ? 'text-[#FF9900]' : 'text-blue-500 dark:text-[#00FF66]'}`}>
                                            {emp.currentProjectLoad}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-[#8a8a8a]">{emp.performanceScore?.toFixed(1) ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <button onClick={() => handleArchive(emp.employeeId)} className="text-gray-500 dark:text-[#8a8a8a] hover:text-[#FF3333] transition-colors">
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">➔ No employees found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            }

            {/* Add Employee Modal */}
            {showAdd && <AddEmployeeModal
                prefillRequest={requestPrefill}
                onClose={() => {
                    setShowAdd(false);
                    setRequestPrefill(null);
                    if (searchParams.get('requestId')) setSearchParams({});
                }}
                onCreated={fetchEmployees}
            />}

            {/* Bulk Import Modal */}
            {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} onDone={fetchEmployees} />}
        </div>
    );
};

function AddEmployeeModal({ onClose, onCreated, prefillRequest }: { onClose: () => void; onCreated: () => void; prefillRequest?: EmployeeRequest | null }) {
    const [form, setForm] = useState({
        role: 'employee' as 'employee' | 'manager',
        name: '',
        workEmail: '',
        department: prefillRequest?.requestedRole || '',
        seniorityLevel: 'mid',
        location: 'Remote',
        costPerDay: '',
        travelEligible: false,
        skills: (prefillRequest?.skillsRequired || []).map(skill => skill.skill_name).join(', '),
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const isManager = form.role === 'manager';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.workEmail || !form.department) { setError('Name, email, and department are required.'); return; }
        setLoading(true); setError('');
        const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, proficiency: 'intermediate' }));
        const res = await api.createEmployee({
            name: form.name, workEmail: form.workEmail, department: form.department,
            seniorityLevel: form.seniorityLevel, location: form.location,
            travelEligible: form.travelEligible,
            costPerDay: form.costPerDay ? parseFloat(form.costPerDay) : undefined,
            skills,
            role: form.role,
            requestId: prefillRequest?.requestId,
        });
        setLoading(false);
        if (res.success) { setResult(res); onCreated(); }
        else setError(res.message || 'Failed to create employee.');
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="bg-[#111111] flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/10">
                    <div className="w-3 h-3 rounded-full bg-[#FF3333]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FF9900]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#00FF66]"></div>
                    <span className="ml-4 font-mono text-[10px] text-gray-500 dark:text-[#8a8a8a] tracking-wider uppercase">~/nexus/action</span>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Add Employee</h2>
                        <button onClick={onClose} className="text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white transition-colors"><X className="w-5 h-5" /></button>
                    </div>

                    {result ? (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-[#00FF66]/10 border border-blue-500 dark:border-[#00FF66]/20 flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
                            <h3 className="text-gray-900 dark:text-white font-black uppercase">{isManager ? 'Manager' : 'Employee'} Created!</h3>
                            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs mt-2">ID: {result.employee?.displayId || result.user?.id || '—'}</p>
                            {result.onboarding?.message && <p className="text-[#9D4EDD] font-mono text-xs mt-2">{result.onboarding.message}</p>}
                            {resendMessage && <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs mt-2">{resendMessage}</p>}
                            {result.onboarding?.inviteUserId && (
                                <button
                                    onClick={async () => {
                                        setResendLoading(true);
                                        setResendMessage('');
                                        const resend = await api.resendInvite(result.onboarding.inviteUserId);
                                        setResendLoading(false);
                                        setResendMessage(resend.message || (resend.success ? 'Invite email sent.' : 'Failed to resend invite.'));
                                    }}
                                    disabled={resendLoading}
                                    className="mt-4 w-full border border-gray-200 dark:border-white/10 hover:border-blue-500 dark:border-[#00FF66] text-gray-900 dark:text-white uppercase tracking-widest text-xs px-6 py-2 transition-colors disabled:opacity-50"
                                >
                                    {resendLoading ? 'Resending Invite...' : 'Resend Invite Email'}
                                </button>
                            )}
                            <button onClick={onClose} className="mt-4 bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-2 hover:bg-gray-200 transition-colors">Done</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Role selector */}
                            {prefillRequest && (
                                <div className="border border-blue-500 dark:border-[#00FF66]/20 bg-[#00FF66]/5 p-3 text-sm text-blue-500 dark:text-[#00FF66] font-mono">
                                    <p className="font-bold uppercase text-xs tracking-widest">Approving manager request</p>
                                    <p className="mt-1 text-[10px] text-blue-500 dark:text-[#00FF66]/80 uppercase tracking-widest">Requested role: {prefillRequest.requestedRole} • Priority: {prefillRequest.priority}</p>
                                </div>
                            )}
                            <div>
                                <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Role *</label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'employee' | 'manager' })}
                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors">
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Full Name *</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                </div>
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Work Email *</label>
                                    <input type="email" value={form.workEmail} onChange={e => setForm({ ...form, workEmail: e.target.value })}
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Department *</label>
                                    <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                </div>
                                {!isManager && (
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Seniority</label>
                                    <select value={form.seniorityLevel} onChange={e => setForm({ ...form, seniorityLevel: e.target.value })}
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors">
                                        {SENIORITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Location</label>
                                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                </div>
                                {!isManager && (
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Cost/Day (₹)</label>
                                    <input type="number" value={form.costPerDay} onChange={e => setForm({ ...form, costPerDay: e.target.value })}
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                                </div>
                                )}
                            </div>
                            {!isManager && (
                            <div>
                                <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Skills (comma-separated)</label>
                                <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Python, AWS..."
                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors" />
                            </div>
                            )}
                            {!isManager && (
                            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8a8a8a] cursor-pointer">
                                <input type="checkbox" checked={form.travelEligible} onChange={() => setForm({ ...form, travelEligible: !form.travelEligible })} className="w-4 h-4" />
                                Travel eligible
                            </label>
                            )}
                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-[#FF3333]/5 border-l-2 border-[#FF3333] text-[#FF3333] font-mono text-xs">
                                    {error}
                                </div>
                            )}
                            <button type="submit" disabled={loading}
                                className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning...</> : isManager ? 'Create Manager & Send Invite' : 'Create Employee & Send Invite'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function BulkImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
    const [csvText, setCsvText] = useState('');
    const [role, setRole] = useState<'employee' | 'manager'>('employee');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCsvText(reader.result as string);
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const header = 'name,email,department,seniority,location,costPerDay,skills,travelEligible,performanceScore,tenureYears';
        const sample = 'Jane Doe,jane@company.com,Engineering,mid,Remote,5000,React;Node.js;AWS,true,4.2,3';
        const blob = new Blob([header + '\n' + sample + '\n'], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'employee_import_template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleSubmit = async () => {
        if (!csvText.trim()) { setError('Please upload or paste a CSV file.'); return; }
        setLoading(true); setError('');
        try {
            const res = await api.bulkImportEmployees(csvText, role);
            if (res.results) { setResults(res.results); onDone(); }
            else setError(res.message || 'Import failed.');
        } catch (err: any) {
            setError(err.message || 'Import failed.');
        }
        setLoading(false);
    };

    const successCount = results?.filter(r => r.status === 'created').length ?? 0;
    const failCount = results?.filter(r => r.status !== 'created').length ?? 0;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="bg-[#111111] flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/10">
                    <div className="w-3 h-3 rounded-full bg-[#FF3333]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FF9900]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#00FF66]"></div>
                    <span className="ml-4 font-mono text-[10px] text-gray-500 dark:text-[#8a8a8a] tracking-wider uppercase">~/nexus/action</span>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Bulk Import</h2>
                        <button onClick={onClose} className="text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white transition-colors"><X className="w-5 h-5" /></button>
                    </div>

                    {results ? (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 bg-[#00FF66]/10 border border-blue-500 dark:border-[#00FF66]/20 p-4 text-center">
                                    <p className="text-2xl font-black text-blue-500 dark:text-[#00FF66]">{successCount}</p>
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Imported</p>
                                </div>
                                <div className="flex-1 bg-[#FF3333]/10 border border-[#FF3333]/20 p-4 text-center">
                                    <p className="text-2xl font-black text-[#FF3333]">{failCount}</p>
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Failed</p>
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 max-h-60 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-white/10">
                                            <th className="text-left px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Row</th>
                                            <th className="text-left px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Email</th>
                                            <th className="text-left px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Status</th>
                                            <th className="text-left px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Invite</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((r, i) => (
                                            <tr key={i} className="border-b border-gray-200 dark:border-white/10/50">
                                                <td className="px-4 py-2 text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">{r.row ?? i + 1}</td>
                                                <td className="px-4 py-2 text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">{r.email || '—'}</td>
                                                <td className="px-4 py-2">
                                                    {r.status === 'created'
                                                        ? <span className="text-blue-500 dark:text-[#00FF66] font-mono text-[10px] uppercase tracking-widest">Success</span>
                                                        : <span className="text-[#FF3333] font-mono text-[10px]">{r.error}</span>}
                                                </td>
                                                <td className="px-4 py-2 text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">{r.onboarding || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={onClose} className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-2.5 hover:bg-gray-200 transition-colors">Done</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <button onClick={downloadTemplate}
                                    className="flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:border-blue-500 dark:border-[#00FF66] text-gray-500 dark:text-[#8a8a8a] hover:text-gray-900 dark:text-white uppercase tracking-widest text-xs px-4 py-2 transition-colors">
                                    <Download className="w-4 h-4" /> Download Template
                                </button>
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Role for imported users</label>
                                    <select value={role} onChange={e => setRole(e.target.value as 'employee' | 'manager')}
                                        className="bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors">
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Upload CSV</label>
                                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-white/80 dark:bg-[#1a1a1c]/80 backdrop-blur-md file:text-gray-900 dark:text-white file:text-xs file:cursor-pointer file:uppercase file:tracking-widest" />
                            </div>

                            <div>
                                <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mb-2">Or paste CSV content</label>
                                <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={6} placeholder="name,email,department,seniority,..."
                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 px-3 py-2.5 text-gray-900 dark:text-white text-sm font-mono outline-none focus:border-blue-500 dark:border-[#00FF66] transition-colors resize-none" />
                            </div>

                            {csvText && (
                                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">
                                    {csvText.trim().split('\n').length - 1} data row(s) detected
                                </p>
                            )}

                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-[#FF3333]/5 border-l-2 border-[#FF3333] text-[#FF3333] font-mono text-xs">
                                    {error}
                                </div>
                            )}

                            <button onClick={handleSubmit} disabled={loading}
                                className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import CSV</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EmployeeManagement;
