import React from 'react';
import { Plus } from 'lucide-react';
import { teamMembers } from '../managerDashboardData';
import { LoadBar, Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const ManagerTeamManagement: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Team Management</h1>
                <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Roster, workload, and role visibility</p>
            </div>
            <button className="flex items-center justify-center gap-2 bg-white text-black border border-gray-200 font-bold uppercase tracking-widest text-xs px-6 py-2.5 hover:bg-gray-100 transition-colors">
                <Plus className="w-4 h-4" />
                Add Member
            </button>
        </div>

        <Panel>
            <SectionHeader eyebrow="ROSTER" title="Active Team Members" meta={`${teamMembers.length} PEOPLE`} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {teamMembers.map(member => (
                    <div key={member.name} className="border border-gray-200 dark:border-white/10 p-5">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                                <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{member.name}</p>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">{member.role}</p>
                            </div>
                            <StatusPill label={member.status} tone={member.load > 80 ? 'yellow' : 'green'} />
                        </div>
                        <LoadBar value={member.load} />
                    </div>
                ))}
            </div>
        </Panel>
    </div>
);

export default ManagerTeamManagement;
