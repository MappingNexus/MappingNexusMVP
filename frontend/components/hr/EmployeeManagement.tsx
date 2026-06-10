/**
 * Employee Management — HR CRUD + Provisioning + Bulk Import
 */
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Archive, Search, X, Loader2, Upload, Download, FileText } from 'lucide-react';
import * as api from '../../services/api';
import type { AdminUser, Employee, EmployeeRequest, Project } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'];
const EMPLOYEE_METADATA_KEY = 'mapping_nexus_employee_metadata';

type EmployeeMetadata = {
 assignedProject?: string;
 skillsSummary?: string;
};

function readEmployeeMetadata(): Record<string, EmployeeMetadata> {
 try {
 const raw = localStorage.getItem(EMPLOYEE_METADATA_KEY);
 return raw ? JSON.parse(raw) : {};
 } catch {
 return {};
 }
}

function saveEmployeeMetadata(employeeId: string, metadata: EmployeeMetadata) {
 const current = readEmployeeMetadata();
 localStorage.setItem(EMPLOYEE_METADATA_KEY, JSON.stringify({
 ...current,
 [employeeId]: metadata,
 }));
}

function fileToBase64(file: File): Promise<string> {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () => {
 const result = String(reader.result || '');
 resolve(result.includes(',') ? result.split(',')[1] : result);
 };
 reader.onerror = () => reject(new Error('Unable to read CV file.'));
 reader.readAsDataURL(file);
 });
}

const EmployeeManagement: React.FC = () => {
 const [employees, setEmployees] = useState<Employee[]>([]);
 const [loading, setLoading] = useState(true);
 const [showAdd, setShowAdd] = useState(false);
 const [showBulkImport, setShowBulkImport] = useState(false);
 const [search, setSearch] = useState('');
 const [deptFilter, setDeptFilter] = useState('');
 const [inviteStatus, setInviteStatus] = useState<{ configured: boolean; message: string } | null>(null);
 const [employeeMetadata, setEmployeeMetadata] = useState<Record<string, EmployeeMetadata>>({});
 const [searchParams, setSearchParams] = useSearchParams();
 const [requestPrefill, setRequestPrefill] = useState<EmployeeRequest | null>(null);

 useEffect(() => {
 setEmployeeMetadata(readEmployeeMetadata());
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
 <div className="cb-page">
 <div className="cb-page-header">
 <div>
 <h1 className="cb-h1">Employees</h1>
 <p className="cb-subtitle mt-3"><span className="font-mono">{employees.length}</span> total across your organization</p>
 </div>
 <div className="flex flex-col gap-3 sm:flex-row">
 <button onClick={() => { setRequestPrefill(null); setShowAdd(true); }} className="cb-btn-primary">
 <Plus className="w-4 h-4" /> Add employee
 </button>
 </div>
 </div>

 {/* Filters */}
 {inviteStatus && !inviteStatus.configured && (
 <div className="bg-[#FF9900]/10 border border-[#FF9900]/20 p-4 text-sm text-[#FF9900] font-mono">
 Invite delivery issue: {inviteStatus.message}
 </div>
 )}

 <div className="flex gap-3 flex-wrap items-center">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or department..." className="cb-input pl-10" />
 </div>
 <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="cb-input w-[220px]">
 <option value="">All Departments</option>
 {departments.map(d => <option key={d} value={d}>{d}</option>)}
 </select>
 </div>

 {loading ? <LoadingSpinner /> :
 <div className="cb-card overflow-hidden">
 <table className="cb-table">
 <thead>
 <tr>
 {['Name', 'Email', 'Department', 'Role', 'Skills', 'Resume', 'Project', 'Manager', 'Created', 'Actions'].map(h => (
 <th key={h}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filtered.map(emp => (
 <tr key={emp.employeeId} className="border-b border-border hover:bg-white/[0.02] transition-colors">
 <td className="px-5 py-3">
 <p className="text-sm font-medium text-foreground dark:text-white">{emp.name || `Employee ${emp.displayId}`}</p>
 <p className="text-xs text-muted-foreground font-mono">{emp.displayId}</p>
 </td>
 <td className="px-5 py-3 text-sm text-muted-foreground dark:text-[#8a8a8a]">{emp.workEmail || 'Not available'}</td>
 <td className="px-5 py-3 text-sm text-muted-foreground dark:text-[#8a8a8a]">{emp.department}</td>
 <td className="px-5 py-3"><span className="border border-[#9D4EDD]/30 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#9D4EDD] bg-[#9D4EDD]/10 capitalize">{emp.role || 'employee'}</span></td>
 <td className="px-5 py-3 min-w-[180px]">
 <div className="flex flex-wrap gap-1.5">
 {(emp.skills?.length ? emp.skills.map(skill => skill.skill_name || skill.name).filter(Boolean) : (employeeMetadata[emp.employeeId]?.skillsSummary || '').split(',').map(skill => skill.trim()).filter(Boolean)).slice(0, 4).map(skill => (
 <span key={skill} className="border border-blue-500/30 bg-blue-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-blue-500 dark:text-[#00FF66]">{skill}</span>
 ))}
 {(!emp.skills?.length && !employeeMetadata[emp.employeeId]?.skillsSummary) && <span className="text-xs text-muted-foreground">No skills</span>}
 </div>
 </td>
 <td className="px-5 py-3 text-sm text-muted-foreground dark:text-[#8a8a8a]">
 {emp.hasCv ? (
 <div className="flex flex-wrap gap-2">
 <button
 onClick={async () => {
 const result = await api.openEmployeeCv(emp.employeeId);
 if (!result.success) alert(result.message || 'Unable to open resume.');
 }}
 title={emp.cvFileName || 'View Resume'}
 className="inline-flex items-center gap-2 max-w-[180px] text-blue-500 hover:underline"
 >
 <FileText className="w-4 h-4 shrink-0" />
 <span className="truncate">View</span>
 </button>
 <button
 onClick={async () => {
 const result = await api.downloadEmployeeCv(emp.employeeId, emp.cvFileName || 'resume.pdf');
 if (!result.success) alert(result.message || 'Unable to download resume.');
 }}
 title={emp.cvFileName || 'Download Resume'}
 className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
 >
 <Download className="w-4 h-4 shrink-0" />
 <span>Download</span>
 </button>
 </div>
 ) : (
 <span className="text-xs text-muted-foreground">No Resume</span>
 )}
 </td>
 <td className="px-5 py-3 text-sm text-muted-foreground dark:text-[#8a8a8a]">{emp.assignedProject || employeeMetadata[emp.employeeId]?.assignedProject || 'Unassigned'}</td>
 <td className="px-5 py-3 text-sm text-muted-foreground dark:text-[#8a8a8a]">{emp.managerEmail || 'Unassigned'}</td>
 <td className="px-5 py-3 text-sm text-muted-foreground dark:text-[#8a8a8a]">{emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'Not available'}</td>
 <td className="px-5 py-3">
 <button onClick={() => handleArchive(emp.employeeId)} className="text-gray-500 hover:text-[#FF3333] transition-colors">
 <Archive className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))}
 {filtered.length === 0 && (
 <tr><td colSpan={10} className="px-5 py-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">No employees found</td></tr>
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
 onCreated={() => {
 fetchEmployees();
 setEmployeeMetadata(readEmployeeMetadata());
 }}
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
 projectId: '',
 managerId: '',
 });
 const [cvFile, setCvFile] = useState<File | null>(null);
 const [projects, setProjects] = useState<Project[]>([]);
 const [managers, setManagers] = useState<AdminUser[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [result, setResult] = useState<any>(null);
 const [resendLoading, setResendLoading] = useState(false);
 const [resendMessage, setResendMessage] = useState('');
 const isManager = form.role === 'manager';

 useEffect(() => {
 api.getProjects().then(res => {
 if (res.success) setProjects(res.projects || []);
 }).catch(() => {});
 api.getAdminUsers('manager').then(res => {
 if (res.success) setManagers((res.users || []).filter(manager => manager.status === 'active'));
 }).catch(() => {});
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.name || !form.workEmail || !form.department) { setError('Name, email, and department are required.'); return; }
 setLoading(true); setError('');
 const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, proficiency: 'intermediate' }));
 let cvPayload: { cvFileName?: string; cvMimeType?: string; cvDataBase64?: string } = {};
 if (cvFile) {
 if (cvFile.size > 5 * 1024 * 1024) {
 setLoading(false);
 setError('CV file must be 5MB or smaller.');
 return;
 }
 cvPayload = {
 cvFileName: cvFile.name,
 cvMimeType: cvFile.type || 'application/octet-stream',
 cvDataBase64: await fileToBase64(cvFile),
 };
 }
 const res = await api.createEmployee({
 name: form.name, workEmail: form.workEmail, department: form.department,
 seniorityLevel: form.seniorityLevel, location: form.location,
 travelEligible: form.travelEligible,
 costPerDay: form.costPerDay ? parseFloat(form.costPerDay) : undefined,
 skills,
 role: form.role,
 requestId: prefillRequest?.requestId,
 managerId: form.managerId || undefined,
 projectId: form.projectId || undefined,
 ...cvPayload,
 });
 if (res.success) {
 const employeeId = res.employee?.employeeId;
 if (employeeId) {
 saveEmployeeMetadata(employeeId, {
 assignedProject: projects.find(project => project.project_id === form.projectId)?.project_name,
 skillsSummary: form.skills,
 });
 if (cvFile && cvPayload.cvFileName && cvPayload.cvMimeType && cvPayload.cvDataBase64 && !res.employee?.hasCv) {
 const cvRes = await api.uploadEmployeeCv(employeeId, {
 cvFileName: cvPayload.cvFileName,
 cvMimeType: cvPayload.cvMimeType,
 cvDataBase64: cvPayload.cvDataBase64,
 });
 if (!cvRes.success) {
 setError(cvRes.message || 'Employee created, but CV could not be saved.');
 setLoading(false);
 return;
 }
 }
 }
 setLoading(false);
 setResult(res);
 onCreated();
 }
 else {
 setLoading(false);
 setError(res.message || 'Failed to create employee.');
 }
 };

 return (
 <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="border border-white/15 bg-[#0b0d10] text-white w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl shadow-2xl">
 <div className="sticky top-0 z-10 bg-[#12151a] flex items-center gap-2 px-4 py-3 border-b border-white/10">
 <div className="w-3 h-3 rounded-full bg-[#FF3333]"></div>
 <div className="w-3 h-3 rounded-full bg-[#FF9900]"></div>
 <div className="w-3 h-3 rounded-full bg-[#00FF66]"></div>
 <span className="ml-4 font-mono text-[10px] text-white/50 tracking-wider uppercase">~/nexus/action</span>
 </div>
 <div className="p-6">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-lg font-black text-white uppercase tracking-tight">Add Employee</h2>
 <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
 </div>

 {result ? (
 <div className="text-center py-6">
 <div className="w-12 h-12 bg-[#00FF66]/10 border border-blue-500 flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
 <h3 className="text-foreground font-black uppercase">{isManager ? 'Manager' : 'Employee'} Created!</h3>
 <p className="text-gray-500 font-mono text-xs mt-2">ID: {result.employee?.displayId || result.user?.id || '—'}</p>
 {result.onboarding?.message && <p className="text-[#9D4EDD] font-mono text-xs mt-2">{result.onboarding.message}</p>}
 {resendMessage && <p className="text-gray-500 font-mono text-xs mt-2">{resendMessage}</p>}
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
 className="mt-4 w-full border border-border hover:border-blue-500 text-foreground uppercase tracking-widest text-xs px-6 py-2 transition-colors disabled:opacity-50"
 >
 {resendLoading ? 'Resending Invite...' : 'Resend Invite Email'}
 </button>
 )}
 <button onClick={onClose} className="mt-4 bg-blue-600 text-white font-bold uppercase tracking-widest text-xs px-6 py-2 hover:bg-blue-500 transition-colors">Done</button>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4">
 {/* Role selector */}
 {prefillRequest && (
 <div className="border border-blue-500 bg-[#00FF66]/5 p-3 text-sm text-primary font-mono">
 <p className="font-bold uppercase text-xs tracking-widest">Approving manager request</p>
 <p className="mt-1 text-[10px] text-primary uppercase tracking-widest">Requested role: {prefillRequest.requestedRole} • Priority: {prefillRequest.priority}</p>
 </div>
 )}
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Role *</label>
 <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'employee' | 'manager' })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors">
 <option value="employee">Employee</option>
 <option value="manager">Manager</option>
 </select>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Full Name *</label>
 <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
 </div>
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Work Email *</label>
 <input type="email" value={form.workEmail} onChange={e => setForm({ ...form, workEmail: e.target.value })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Department *</label>
 <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
 </div>
 {!isManager && (
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Seniority</label>
 <select value={form.seniorityLevel} onChange={e => setForm({ ...form, seniorityLevel: e.target.value })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors">
 {SENIORITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>
 )}
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Location</label>
 <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
 </div>
 {!isManager && (
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Cost/Day (₹)</label>
 <input type="number" value={form.costPerDay} onChange={e => setForm({ ...form, costPerDay: e.target.value })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
 </div>
 )}
 </div>
 {!isManager && (
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Skills (comma-separated)</label>
 <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Python, AWS..."
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white placeholder:text-white/35 text-sm outline-none focus:border-blue-500 transition-colors" />
 </div>
 )}
 {!isManager && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Manager Assignment</label>
 <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors">
 <option value="">Unassigned</option>
 {managers.map(manager => (
 <option key={manager.userId} value={manager.userId}>{manager.email}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">Project Assignment</label>
 <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors">
 <option value="">Unassigned</option>
 {projects.map(project => (
 <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
 ))}
 </select>
 </div>
 </div>
 )}
 {!isManager && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">CV / Resume</label>
 <input
 type="file"
 accept=".pdf,.doc,.docx"
 onChange={e => setCvFile(e.target.files?.[0] || null)}
 className="w-full bg-[#11151b] border border-white/15 px-3 py-2.5 text-white text-sm file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-blue-600 file:text-white file:text-xs file:cursor-pointer file:uppercase file:tracking-widest"
 />
 {cvFile && <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/60">{cvFile.name}</p>}
 </div>
 <div className="border border-white/15 bg-[#11151b] px-3 py-2.5 text-xs font-mono uppercase tracking-widest text-white/60">
 Resume is saved with the employee record.
 </div>
 </div>
 )}
 {!isManager && (
 <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
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
 className="sticky bottom-0 w-full bg-blue-600 text-white font-bold uppercase tracking-widest text-xs py-3 hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
 <div className="fixed inset-0 bg-card flex items-center justify-center z-50 p-4">
 <div className="border border-border bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
 <div className="bg-gray-50 flex items-center gap-2 px-4 py-3 border-b border-border dark:border-white/10">
 <div className="w-3 h-3 rounded-full bg-[#FF3333]"></div>
 <div className="w-3 h-3 rounded-full bg-[#FF9900]"></div>
 <div className="w-3 h-3 rounded-full bg-[#00FF66]"></div>
 <span className="ml-4 font-mono text-[10px] text-muted-foreground tracking-wider uppercase">~/nexus/action</span>
 </div>
 <div className="p-6">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Bulk Import</h2>
 <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></button>
 </div>

 {results ? (
 <div className="space-y-4">
 <div className="flex gap-4">
 <div className="flex-1 bg-[#00FF66]/10 border border-blue-500 p-4 text-center">
 <p className="text-2xl font-black text-primary dark:text-[#00FF66]">{successCount}</p>
 <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">Imported</p>
 </div>
 <div className="flex-1 bg-[#FF3333]/10 border border-[#FF3333]/20 p-4 text-center">
 <p className="text-2xl font-black text-[#FF3333]">{failCount}</p>
 <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">Failed</p>
 </div>
 </div>
 <div className="bg-white/50 border border-border max-h-60 overflow-y-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border dark:border-white/10">
 <th className="text-left px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">Row</th>
 <th className="text-left px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">Email</th>
 <th className="text-left px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">Status</th>
 <th className="text-left px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">Invite</th>
 </tr>
 </thead>
 <tbody>
 {results.map((r, i) => (
 <tr key={i} className="border-b border-border dark:border-white/10/50">
 <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{r.row ?? i + 1}</td>
 <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{r.email || '—'}</td>
 <td className="px-4 py-2">
 {r.status === 'created'
 ? <span className="text-blue-500 font-mono text-[10px] uppercase tracking-widest">Success</span>
 : <span className="text-[#FF3333] font-mono text-[10px]">{r.error}</span>}
 </td>
 <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{r.onboarding || '—'}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 <button onClick={onClose} className="sticky bottom-0 w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs py-3 hover:opacity-90 transition-colors">Done</button>
 </div>
 ) : (
 <div className="space-y-4">
 <div className="flex gap-3">
 <button onClick={downloadTemplate}
 className="flex items-center gap-2 border border-border hover:border-blue-500 text-muted-foreground hover:text-gray-900 uppercase tracking-widest text-xs px-4 py-2 transition-colors">
 <Download className="w-4 h-4" /> Download Template
 </button>
 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Role for imported users</label>
 <select value={role} onChange={e => setRole(e.target.value as 'employee' | 'manager')}
 className="bg-transparent border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-primary transition-colors">
 <option value="employee">Employee</option>
 <option value="manager">Manager</option>
 </select>
 </div>
 </div>

 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Upload CSV</label>
 <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
 className="w-full bg-background border border-border px-3 py-2.5 text-foreground text-sm file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:cursor-pointer file:uppercase file:tracking-widest" />
 </div>

 <div>
 <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Or paste CSV content</label>
 <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={6} placeholder="name,email,department,seniority,..."
 className="w-full bg-background border border-border px-3 py-2.5 text-foreground text-sm font-mono outline-none focus:border-primary transition-colors resize-none" />
 </div>

 {csvText && (
 <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground dark:text-[#8a8a8a]">
 {csvText.trim().split('\n').length - 1} data row(s) detected
 </p>
 )}

 {error && (
 <div className="flex items-start gap-3 p-4 bg-[#FF3333]/5 border-l-2 border-[#FF3333] text-[#FF3333] font-mono text-xs">
 {error}
 </div>
 )}

 <button onClick={handleSubmit} disabled={loading}
 className="sticky bottom-0 w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs py-3 hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
