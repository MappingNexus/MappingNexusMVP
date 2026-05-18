import React from 'react';
import { RefreshCw } from 'lucide-react';
import { chartBars, managerMetrics, notifications, recentActivity, teamMembers } from '../managerDashboardData';
import { LoadBar, MetricCard, MiniBarChart, Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const ManagerDashboardHome: React.FC = () => {
    const currentTimestamp = new Date().toLocaleString();

    return (
        <div className="flex flex-col gap-10 pb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Manager Command Center</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-4 font-mono text-gray-500 dark:text-[#8a8a8a] text-xs uppercase tracking-widest">
                        <span>24 TEAM MEMBERS</span>
                        <span className="text-[#333333]">//</span>
                        <span>[ VIEWED {currentTimestamp} ]</span>
                        <span className="text-[#333333]">//</span>
                        <div className="flex items-center gap-2 text-blue-500 dark:text-[#00FF66]">
                            <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
                            LIVE
                        </div>
                    </div>
                </div>
                <button className="flex items-center justify-center gap-2 border border-[#333333] bg-white/50 dark:bg-black/50 backdrop-blur-md hover:bg-white hover:text-black text-gray-900 dark:text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync View
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {managerMetrics.map(metric => <MetricCard key={metric.label} {...metric} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
                <Panel>
                    <SectionHeader eyebrow="DELIVERY.TREND" title="Weekly Output Signal" meta="PLACEHOLDER CHART" />
                    <MiniBarChart values={chartBars} />
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Panel>
                    <SectionHeader eyebrow="TEAM.HEALTH" title="Team Load Snapshot" meta="TOP 6" />
                    <div className="space-y-4">
                        {teamMembers.map(member => (
                            <div key={member.name} className="border border-gray-200 dark:border-white/10 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white uppercase tracking-wide">{member.name}</p>
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">{member.role} / {member.department}</p>
                                    </div>
                                    <StatusPill label={member.status} tone={member.load >= 80 ? 'yellow' : 'green'} />
                                </div>
                                <LoadBar value={member.load} />
                            </div>
                        ))}
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
