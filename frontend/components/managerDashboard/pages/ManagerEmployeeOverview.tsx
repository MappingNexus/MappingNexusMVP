import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Eye, FileText, Loader2, RefreshCw } from 'lucide-react';
import * as api from '../../../services/api';
import type { Employee } from '../../../types';
import { Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

function formatSeniority(value?: string) {
    if (!value) return 'Employee';
    return `${value.charAt(0).toUpperCase()}${value.slice(1)} Employee`;
}

function statusFor(employee: Employee) {
    if (employee.isArchived) return { label: 'Archived', tone: 'neutral' as const };
    if (employee.currentProjectLoad > 0) return { label: 'Assigned', tone: 'blue' as const };
    return { label: 'Available', tone: 'green' as const };
}

const ManagerEmployeeOverview: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyCvId, setBusyCvId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const fetchEmployees = async () => {
        setLoading(true);
        setError('');
        const response = await api.getEmployees();
        if (response.success) {
            setEmployees(response.employees || []);
        } else {
            setError(api.getErrorMessage(response, 'Unable to load employees.'));
        }
        setLoading(false);
    };

    useEffect(() => {
        void fetchEmployees();
    }, []);

    const totals = useMemo(() => ({
        employees: employees.length,
        resumes: employees.filter(employee => employee.hasCv).length,
    }), [employees]);

    const handleViewResume = async (employee: Employee) => {
        if (!employee.hasCv) return;
        setBusyCvId(employee.employeeId);
        const result = await api.openEmployeeCv(employee.employeeId);
        if (!result.success) setError(result.message || 'Unable to open resume.');
        setBusyCvId(null);
    };

    const handleDownloadResume = async (employee: Employee) => {
        if (!employee.hasCv) return;
        setBusyCvId(employee.employeeId);
        const result = await api.downloadEmployeeCv(employee.employeeId, employee.cvFileName || `${employee.name || employee.displayId}-resume.pdf`);
        if (!result.success) setError(result.message || 'Unable to download resume.');
        setBusyCvId(null);
    };

    return (
        <div className="flex flex-col gap-8 pb-8">
            <div className="border-b border-gray-200 dark:border-white/10 pb-8">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Employee Overview</h1>
                <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Employee summary, status, and resume access</p>
            </div>
            <Panel>
                <SectionHeader eyebrow="EMPLOYEE.INDEX" title="Direct Reports" meta={`${totals.resumes}/${totals.employees} RESUMES`} />

                {error && (
                    <div className="mb-4 flex items-start gap-3 border border-[#FF3333]/30 bg-[#FF3333]/5 px-4 py-3 text-sm text-[#FF3333]">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-gray-500 dark:text-[#8a8a8a]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-mono text-xs uppercase tracking-widest">Loading employees</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/10 text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">
                                    <th className="py-3 pr-4">Employee Name</th>
                                    <th className="py-3 pr-4">Email</th>
                                    <th className="py-3 pr-4">Role</th>
                                    <th className="py-3 pr-4">Department</th>
                                    <th className="py-3 pr-4">Assigned Project</th>
                                    <th className="py-3 pr-4">Performance</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 pr-4">Resume</th>
                                    <th className="py-3 pr-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(employee => {
                                    const status = statusFor(employee);
                                    const busy = busyCvId === employee.employeeId;
                                    return (
                                        <tr key={employee.employeeId} className="border-b border-gray-200 dark:border-white/10 last:border-0">
                                            <td className="py-4 pr-4">
                                                <p className="font-bold text-gray-900 dark:text-white">{employee.name || `Employee ${employee.displayId}`}</p>
                                                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">{employee.displayId}</p>
                                            </td>
                                            <td className="py-4 pr-4 text-gray-600 dark:text-[#cfcfcf]">{employee.workEmail || 'Not available'}</td>
                                            <td className="py-4 pr-4 text-gray-600 dark:text-[#cfcfcf]">{employee.role || formatSeniority(employee.seniorityLevel)}</td>
                                            <td className="py-4 pr-4 text-gray-600 dark:text-[#cfcfcf]">{employee.department}</td>
                                            <td className="py-4 pr-4 text-gray-600 dark:text-[#cfcfcf]">{employee.assignedProject || 'Unassigned'}</td>
                                            <td className="py-4 pr-4 font-mono text-blue-500 dark:text-[#00FF66]">
                                                {employee.performanceScore !== undefined ? `${employee.performanceScore.toFixed(1)}` : 'Not available'}
                                            </td>
                                            <td className="py-4 pr-4"><StatusPill label={status.label} tone={status.tone} /></td>
                                            <td className="py-4 pr-4">
                                                {employee.hasCv ? (
                                                    <div className="flex max-w-[220px] items-center gap-2 text-blue-500 dark:text-[#00FF66]">
                                                        <FileText className="h-4 w-4 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold">Uploaded</p>
                                                            <p className="truncate text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">{employee.cvFileName || 'Resume file'}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 dark:text-[#8a8a8a]">No Resume Uploaded</span>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewResume(employee)}
                                                        disabled={!employee.hasCv || busy}
                                                        className="inline-flex items-center gap-2 border border-gray-200 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-[#cfcfcf] dark:hover:border-[#00FF66] dark:hover:text-[#00FF66]"
                                                    >
                                                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                                                        View Resume
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadResume(employee)}
                                                        disabled={!employee.hasCv || busy}
                                                        className="inline-flex items-center gap-2 border border-gray-200 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-[#cfcfcf] dark:hover:border-[#00FF66] dark:hover:text-[#00FF66]"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                        Download
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-[#8a8a8a]">
                                                <RefreshCw className="h-5 w-5" />
                                                <p className="font-mono text-xs uppercase tracking-widest">No employees found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </div>
    );
};

export default ManagerEmployeeOverview;
