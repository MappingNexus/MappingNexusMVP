import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as api from '../../../services/api';
import type { Employee } from '../../../types';
import { AnalyticsEmptyState, Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

function buildReportRows(employees: Employee[]) {
    const groups = new Map<string, { department: string; employees: number; workload: number; performance: number; performanceCount: number; available: number }>();
    for (const employee of employees) {
        const department = employee.department || 'Unassigned';
        const row = groups.get(department) || { department, employees: 0, workload: 0, performance: 0, performanceCount: 0, available: 0 };
        row.employees += 1;
        row.workload += employee.currentProjectLoad || 0;
        if ((employee.currentProjectLoad || 0) <= 2) row.available += 1;
        if (typeof employee.performanceScore === 'number') {
            row.performance += employee.performanceScore;
            row.performanceCount += 1;
        }
        groups.set(department, row);
    }
    return Array.from(groups.values()).map(row => ({
        department: row.department,
        employees: row.employees,
        workload: row.employees ? Math.round((row.workload / row.employees) * 25) : 0,
        attendance: row.employees ? Math.round((row.available / row.employees) * 100) : 0,
        performance: row.performanceCount ? Number((row.performance / row.performanceCount).toFixed(1)) : 0,
    }));
}

const ManagerReportsAnalytics: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            const response = await api.getEmployees();
            if (response.success) {
                setEmployees(response.employees || []);
            } else {
                setError(api.getErrorMessage(response, 'Unable to load report data.'));
            }
            setLoading(false);
        };
        void load();
    }, []);

    const reportRows = useMemo(() => buildReportRows(employees), [employees]);
    const reportItems = [
        { label: 'Employee count report', value: `${employees.length} employees` },
        { label: 'Attendance signal report', value: `${Math.round(reportRows.reduce((sum, row) => sum + row.attendance, 0) / Math.max(1, reportRows.length))}% avg` },
        { label: 'Performance trend report', value: `${reportRows.filter(row => row.performance > 0).length} departments` },
        { label: 'Workload risk report', value: `${employees.filter(employee => (employee.currentProjectLoad || 0) >= 4).length} high load` },
    ];

    return (
        <div className="flex flex-col gap-8 pb-8">
            <div className="border-b border-gray-200 dark:border-white/10 pb-8">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Reports & Analytics</h1>
                <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Manager reporting workspace with live team data</p>
            </div>

            {error && (
                <div className="flex items-start gap-3 border border-[#FF3333]/30 bg-[#FF3333]/5 px-4 py-3 text-sm text-[#FF3333]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <Panel>
                    <div className="flex items-center justify-center gap-3 py-12 text-gray-500 dark:text-[#8a8a8a]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-mono text-xs uppercase tracking-widest">Loading reports</span>
                    </div>
                </Panel>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
                    <Panel>
                        <SectionHeader eyebrow="REPORT.CHART" title="Workload & Attendance" meta="LIVE DATA" />
                        {reportRows.length === 0 ? (
                            <AnalyticsEmptyState />
                        ) : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportRows}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                                        <XAxis dataKey="department" tick={{ fill: '#8a8a8a', fontSize: 10 }} />
                                        <YAxis tick={{ fill: '#8a8a8a', fontSize: 10 }} />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#0b0b0f', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
                                        <Bar dataKey="employees" name="Employees" fill="#3B82F6" />
                                        <Bar dataKey="attendance" name="Attendance signal %" fill="#00FF66" />
                                        <Bar dataKey="workload" name="Workload %" fill="#FF9900" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Panel>
                    <Panel>
                        <SectionHeader eyebrow="EXPORTS" title="Available Reports" meta={`${reportItems.length} LIVE`} />
                        <div className="space-y-4">
                            {reportItems.map((report, index) => (
                                <div key={report.label} className="flex items-center justify-between gap-4 border border-gray-200 dark:border-white/10 p-4">
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white">{report.label}</span>
                                        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">{report.value}</p>
                                    </div>
                                    <StatusPill label={index === 0 ? 'Ready' : 'Live'} tone={index === 0 ? 'green' : 'blue'} />
                                </div>
                            ))}
                        </div>
                    </Panel>
                    <Panel className="xl:col-span-2">
                        <SectionHeader eyebrow="PERFORMANCE.TREND" title="Department Performance" meta="LIVE DATA" />
                        {reportRows.length === 0 ? (
                            <AnalyticsEmptyState />
                        ) : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={reportRows}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                                        <XAxis dataKey="department" tick={{ fill: '#8a8a8a', fontSize: 10 }} />
                                        <YAxis tick={{ fill: '#8a8a8a', fontSize: 10 }} domain={[0, 5]} />
                                        <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.18)' }} contentStyle={{ background: '#0b0b0f', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
                                        <Line type="monotone" dataKey="performance" name="Performance" stroke="#00FF66" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Panel>
                </div>
            )}
        </div>
    );
};

export default ManagerReportsAnalytics;
