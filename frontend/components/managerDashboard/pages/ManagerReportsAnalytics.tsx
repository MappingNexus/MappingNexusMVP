import React from 'react';
import { chartBars } from '../managerDashboardData';
import { MiniBarChart, Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const ManagerReportsAnalytics: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Manager reporting workspace and statistics placeholders</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
            <Panel>
                <SectionHeader eyebrow="REPORT.CHART" title="Output Trend" meta="PLACEHOLDER" />
                <MiniBarChart values={chartBars} />
            </Panel>
            <Panel>
                <SectionHeader eyebrow="EXPORTS" title="Available Reports" meta="3 READY" />
                <div className="space-y-4">
                    {['Weekly workload summary', 'Attendance variance report', 'Performance trend export'].map((report, index) => (
                        <div key={report} className="flex items-center justify-between gap-4 border border-gray-200 dark:border-white/10 p-4">
                            <span className="font-bold text-gray-900 dark:text-white">{report}</span>
                            <StatusPill label={index === 0 ? 'Ready' : 'Queued'} tone={index === 0 ? 'green' : 'neutral'} />
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    </div>
);

export default ManagerReportsAnalytics;
