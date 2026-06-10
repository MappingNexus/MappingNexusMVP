import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CalendarDays, Loader2, RefreshCw, Target, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as api from '../../../services/api';
import type { Employee } from '../../../types';
import { liveProjects, notifications, recentActivity } from '../managerDashboardData';
import { AnalyticsEmptyState, LoadBar, MetricCard, Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

function ProgressBar({ label, value, tone }: { label: string; value: number; tone: 'discussion' | 'work' }) {
    const color = tone === 'discussion' ? '#9D4EDD' : '#00FF66';

    return (
        <div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest mb-1.5">
                <span className="text-gray-500 dark:text-[#8a8a8a]">{label}</span>
                <span style={{ color }}>{value}%</span>
            </div>
            <div className="h-2 border border-gray-200 dark:border-white/10 bg-white/30 dark:bg-black/20">
                <div className="h-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function getPerformance(employee: Employee) {
    return typeof employee.performanceScore === 'number' ? employee.performanceScore : null;
}

function buildDepartmentChart(employees: Employee[]) {
    const groups = new Map<string, { department: string; employees: number; workload: number; performanceTotal: number; performanceCount: number; available: number }>();
    for (const employee of employees) {
        const department = employee.department || 'Unassigned';
        const current = groups.get(department) || { department, employees: 0, workload: 0, performanceTotal: 0, performanceCount: 0, available: 0 };
        const performance = getPerformance(employee);
        current.employees += 1;
        current.workload += employee.currentProjectLoad || 0;
        if ((employee.currentProjectLoad || 0) <= 2) current.available += 1;
        if (performance !== null) {
            current.performanceTotal += performance;
            current.performanceCount += 1;
        }
        groups.set(department, current);
    }

    return Array.from(groups.values()).map(group => ({
        department: group.department,
        employees: group.employees,
        workload: group.employees ? Math.round((group.workload / group.employees) * 25) : 0,
        performance: group.performanceCount ? Number((group.performanceTotal / group.performanceCount).toFixed(1)) : 0,
        attendance: group.employees ? Math.round((group.available / group.employees) * 100) : 0,
    }));
}

const ManagerDashboardHome: React.FC = () => {
    const currentTimestamp = new Date().toLocaleString();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        const response = await api.getEmployees();
        if (response.success) {
            setEmployees(response.employees || []);
        } else {
            setError(api.getErrorMessage(response, 'Unable to load manager dashboard data.'));
        }
        setLoading(false);
    };

    useEffect(() => {
        void fetchDashboardData();
    }, []);

    const chartData = useMemo(() => buildDepartmentChart(employees), [employees]);
    const avgPerformance = useMemo(() => {
        const scores = employees.map(getPerformance).filter((score): score is number => score !== null);
        return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
    }, [employees]);
    const availabilityPct = employees.length
        ? Math.round((employees.filter(employee => (employee.currentProjectLoad || 0) <= 2).length / employees.length) * 100)
        : 0;
    const openRisks = employees.filter(employee => (employee.currentProjectLoad || 0) >= 4).length;
    const metrics = [
        { label: 'TEAM.SIZE', value: String(employees.length), detail: 'ACTIVE DIRECT REPORTS', tone: 'text-gray-900 dark:text-white', icon: Users },
        { label: 'PERFORMANCE', value: avgPerformance === null ? 'N/A' : avgPerformance.toFixed(1), detail: 'AVERAGE SCORE', tone: 'text-blue-500 dark:text-[#00FF66]', icon: Target },
        { label: 'ATTENDANCE', value: `${availabilityPct}%`, detail: 'AVAILABLE CAPACITY SIGNAL', tone: 'text-gray-900 dark:text-white', icon: CalendarDays },
        { label: 'OPEN.RISKS', value: String(openRisks), detail: 'HIGH WORKLOAD EMPLOYEES', tone: 'text-[#FF9900]', icon: Activity },
    ];
    const topEmployees = [...employees]
        .sort((a, b) => (b.currentProjectLoad || 0) - (a.currentProjectLoad || 0))
        .slice(0, 6);

    return (
        <div className="flex flex-col gap-10 pb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Manager Command Center</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-4 font-mono text-gray-500 dark:text-[#8a8a8a] text-xs uppercase tracking-widest">
                        <span>{employees.length} TEAM MEMBERS</span>
                        <span className="text-[#333333]">//</span>
                        <span>[ VIEWED {currentTimestamp} ]</span>
                        <span className="text-[#333333]">//</span>
                        <div className="flex items-center gap-2 text-blue-500 dark:text-[#00FF66]">
                            <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
                            LIVE
                        </div>
                    </div>
                </div>
                <button onClick={fetchDashboardData} disabled={loading} className="flex items-center justify-center gap-2 border border-[#333333] bg-white/50 dark:bg-black/50 backdrop-blur-md hover:bg-white hover:text-black text-gray-900 dark:text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Sync View
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-3 border border-[#FF3333]/30 bg-[#FF3333]/5 px-4 py-3 text-sm text-[#FF3333]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {metrics.map(metric => <MetricCard key={metric.label} {...metric} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
                <Panel>
                    <SectionHeader eyebrow="TEAM.LIVE" title="Department Workload Signal" meta="LIVE DATA" />
                    {loading ? (
                        <div className="min-h-[18rem] flex items-center justify-center gap-3 text-gray-500 dark:text-[#8a8a8a]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="font-mono text-xs uppercase tracking-widest">Loading analytics</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <AnalyticsEmptyState />
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                                    <XAxis dataKey="department" tick={{ fill: '#8a8a8a', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#8a8a8a', fontSize: 10 }} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#0b0b0f', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
                                    <Bar dataKey="employees" name="Employees" fill="#3B82F6" />
                                    <Bar dataKey="attendance" name="Availability %" fill="#00FF66" />
                                    <Bar dataKey="workload" name="Workload %" fill="#FF9900" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Panel>

                <Panel>
                    <SectionHeader eyebrow="NOTIFICATIONS" title="Manager Alerts" meta={`${notifications.length} ACTIVE`} />
                    <div className="space-y-4">
                        {notifications.map(item => (
                            <div key={item.title} className="flex items-start gap-3 border border-gray-200 dark:border-white/10 p-4">
                                <item.icon className={`w-4 h-4 mt-0.5 ${item.tone}`} />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            <Panel>
                <SectionHeader eyebrow="PROJECT.PIPELINE" title="Live Projects" meta={`${liveProjects.length} TRACKED`} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {liveProjects.map(project => (
                        <div key={project.name} className="border border-gray-200 dark:border-white/10 p-5 bg-white/30 dark:bg-black/20">
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div className="min-w-0">
                                    <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">{project.name}</p>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">OWNER / {project.owner}</p>
                                </div>
                                <StatusPill label={project.status} tone={project.status === 'At Risk' ? 'yellow' : 'green'} />
                            </div>
                            <div className="space-y-4">
                                <ProgressBar label="Discussion done" value={project.discussionProgress} tone="discussion" />
                                <ProgressBar label="Work done" value={project.workProgress} tone="work" />
                            </div>
                        </div>
                    ))}
                </div>
            </Panel>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Panel>
                    <SectionHeader eyebrow="TEAM.HEALTH" title="Team Load Snapshot" meta="TOP 6" />
                    <div className="space-y-4">
                        {topEmployees.map(member => (
                            <div key={member.employeeId} className="border border-gray-200 dark:border-white/10 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white uppercase tracking-wide">{member.name || `Employee ${member.displayId}`}</p>
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">{member.seniorityLevel} / {member.department}</p>
                                    </div>
                                    <StatusPill label={(member.currentProjectLoad || 0) >= 4 ? 'At Risk' : 'Healthy'} tone={(member.currentProjectLoad || 0) >= 4 ? 'yellow' : 'green'} />
                                </div>
                                <LoadBar value={Math.min(100, (member.currentProjectLoad || 0) * 25)} />
                            </div>
                        ))}
                        {topEmployees.length === 0 && (
                            <p className="py-8 text-center font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">No team employees found</p>
                        )}
                    </div>
                </Panel>

                <Panel>
                    <SectionHeader eyebrow="ACTIVITY.LOG" title="Recent Activity" meta="TODAY" />
                    <div className="space-y-3">
                        {recentActivity.map(item => (
                            <div key={`${item.actor}-${item.time}`} className="grid grid-cols-[4rem_1fr] gap-4 border-b border-gray-200 dark:border-white/10 pb-3 last:border-0">
                                <span className="font-mono text-[10px] text-blue-500 dark:text-[#00FF66] uppercase tracking-widest">{item.time}</span>
                                <p className="text-sm text-gray-600 dark:text-[#cfcfcf]">
                                    <span className="font-bold text-gray-900 dark:text-white">{item.actor}</span> {item.action}
                                </p>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </div>
    );
};

export default ManagerDashboardHome;
