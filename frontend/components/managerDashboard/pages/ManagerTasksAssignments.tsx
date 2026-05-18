import React from 'react';
import { taskRows } from '../managerDashboardData';
import { Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const priorityTone = (priority: string) => priority === 'High' ? 'red' : priority === 'Medium' ? 'yellow' : 'neutral';

const ManagerTasksAssignments: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Tasks / Assignments</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Assignment queue and delivery ownership</p>
        </div>
        <Panel>
            <SectionHeader eyebrow="TASK.QUEUE" title="Active Assignments" meta={`${taskRows.length} ITEMS`} />
            <div className="space-y-4">
                {taskRows.map(task => (
                    <div key={task.title} className="grid grid-cols-1 lg:grid-cols-[1fr_12rem_9rem_8rem] gap-4 border border-gray-200 dark:border-white/10 p-4 items-center">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{task.title}</p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">Owner: {task.owner}</p>
                        </div>
                        <StatusPill label={task.priority} tone={priorityTone(task.priority) as 'red' | 'yellow' | 'neutral'} />
                        <StatusPill label={task.status} tone={task.status === 'Blocked' ? 'red' : 'blue'} />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">{task.due}</span>
                    </div>
                ))}
            </div>
        </Panel>
    </div>
);

export default ManagerTasksAssignments;
