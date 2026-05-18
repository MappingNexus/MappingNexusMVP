import React from 'react';
import type { UserProfile } from '../../../types';
import { Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

interface Props {
    user: UserProfile;
}

const ManagerProfile: React.FC<Props> = ({ user }) => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Profile</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Manager identity and tenant session</p>
        </div>
        <Panel>
            <SectionHeader eyebrow="PROFILE" title="Session Profile" meta="AUTH BACKED" />
            <div className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-8 items-start">
                <div className="aspect-square border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 flex items-center justify-center">
                    <span className="text-6xl font-black text-blue-500 dark:text-[#00FF66]">{user.email.substring(0, 2).toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 dark:border-white/10 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Email</p>
                        <p className="font-bold text-gray-900 dark:text-white mt-2 break-all">{user.email}</p>
                    </div>
                    <div className="border border-gray-200 dark:border-white/10 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Role</p>
                        <div className="mt-2"><StatusPill label={user.role} tone="green" /></div>
                    </div>
                    <div className="border border-gray-200 dark:border-white/10 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Company</p>
                        <p className="font-bold text-gray-900 dark:text-white mt-2">{user.companyName || 'Company'}</p>
                    </div>
                    <div className="border border-gray-200 dark:border-white/10 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">Session</p>
                        <p className="font-bold text-blue-500 dark:text-[#00FF66] mt-2">Active</p>
                    </div>
                </div>
            </div>
        </Panel>
    </div>
);

export default ManagerProfile;
