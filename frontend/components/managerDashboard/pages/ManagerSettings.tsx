import React from 'react';
import { Panel, SectionHeader, StatusPill } from '../ManagerDashboardWidgets';

const settings = [
    { label: 'Weekly digest', value: 'Enabled' },
    { label: 'Capacity alerts', value: 'Enabled' },
    { label: 'Leave escalation', value: 'Manual review' },
    { label: 'Report visibility', value: 'Manager only' },
];

const ManagerSettings: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Settings</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Manager console preferences</p>
        </div>
        <Panel>
            <SectionHeader eyebrow="PREFERENCES" title="Manager Settings" meta="LOCAL MOCK" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.map(setting => (
                    <div key={setting.label} className="flex items-center justify-between gap-4 border border-gray-200 dark:border-white/10 p-4">
                        <span className="font-bold text-gray-900 dark:text-white">{setting.label}</span>
                        <StatusPill label={setting.value} tone="neutral" />
                    </div>
                ))}
            </div>
        </Panel>
    </div>
);

export default ManagerSettings;
