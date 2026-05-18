import React from 'react';
import { leaveRequests } from '../managerDashboardData';
import { Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const ManagerLeaveRequests: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Leave Requests</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Review requests and coverage impact</p>
        </div>
        <Panel>
            <SectionHeader eyebrow="LEAVE.INBOX" title="Request Queue" meta={`${leaveRequests.length} REQUESTS`} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {leaveRequests.map(request => (
                    <div key={`${request.name}-${request.dates}`} className="border border-gray-200 dark:border-white/10 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{request.name}</p>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">{request.type}</p>
                            </div>
                            <StatusPill label={request.status} tone={request.status === 'Approved' ? 'green' : 'yellow'} />
                        </div>
                        <p className="mt-5 text-sm text-gray-600 dark:text-[#cfcfcf]">{request.dates}</p>
                        <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">{request.impact}</p>
                    </div>
                ))}
            </div>
        </Panel>
    </div>
);

export default ManagerLeaveRequests;
