import React from 'react';
import { messageThreads } from '../managerDashboardData';
import { Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const ManagerMessages: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Messages / Communication</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Manager communication center placeholder</p>
        </div>
        <Panel>
            <SectionHeader eyebrow="COMMS.INBOX" title="Message Threads" meta={`${messageThreads.length} THREADS`} />
            <div className="space-y-4">
                {messageThreads.map(thread => (
                    <div key={thread.subject} className="grid grid-cols-1 md:grid-cols-[1fr_7rem_6rem] gap-4 border border-gray-200 dark:border-white/10 p-4 items-center">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{thread.subject}</p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a] mt-1">{thread.sender}</p>
                        </div>
                        <StatusPill label={thread.unread ? 'Unread' : 'Read'} tone={thread.unread ? 'yellow' : 'neutral'} />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">{thread.time}</span>
                    </div>
                ))}
            </div>
        </Panel>
    </div>
);

export default ManagerMessages;
