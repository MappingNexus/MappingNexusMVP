import React from 'react';
import { teamMembers } from '../managerDashboardData';
import { Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const ManagerPerformanceTracking: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Performance Tracking</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Goals, signals, and performance scores</p>
        </div>
        <Panel>
            <SectionHeader eyebrow="PERFORMANCE" title="Team Scoreboard" meta="CURRENT CYCLE" />
            <div className="space-y-4">
                {teamMembers.map(member => (
                    <div key={member.name} className="grid grid-cols-1 md:grid-cols-[1fr_6rem_10rem] gap-4 border border-gray-200 dark:border-white/10 p-4 items-center">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{member.name}</p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">{member.role}</p>
                        </div>
                        <span className="text-2xl font-black text-blue-500 dark:text-[#00FF66]">{member.performance}%</span>
                        <StatusPill label={member.performance >= 90 ? 'Exceeds' : 'On Track'} tone={member.performance >= 90 ? 'green' : 'blue'} />
                    </div>
                ))}
            </div>
        </Panel>
    </div>
);

export default ManagerPerformanceTracking;
