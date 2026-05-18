import React from 'react';
import { teamMembers } from '../managerDashboardData';
import { Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const ManagerEmployeeOverview: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Employee Overview</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Employee summary and availability snapshot</p>
        </div>
        <Panel>
            <SectionHeader eyebrow="EMPLOYEE.INDEX" title="Direct Reports" meta="READ ONLY" />
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">
                            <th className="py-3 pr-4">Name</th>
                            <th className="py-3 pr-4">Role</th>
                            <th className="py-3 pr-4">Department</th>
                            <th className="py-3 pr-4">Performance</th>
                            <th className="py-3 pr-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamMembers.map(member => (
                            <tr key={member.name} className="border-b border-gray-200 dark:border-white/10 last:border-0">
                                <td className="py-4 pr-4 font-bold text-gray-900 dark:text-white">{member.name}</td>
                                <td className="py-4 pr-4 text-gray-600 dark:text-[#cfcfcf]">{member.role}</td>
                                <td className="py-4 pr-4 text-gray-600 dark:text-[#cfcfcf]">{member.department}</td>
                                <td className="py-4 pr-4 font-mono text-blue-500 dark:text-[#00FF66]">{member.performance}%</td>
                                <td className="py-4 pr-4"><StatusPill label={member.status} tone="neutral" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Panel>
    </div>
);

export default ManagerEmployeeOverview;
