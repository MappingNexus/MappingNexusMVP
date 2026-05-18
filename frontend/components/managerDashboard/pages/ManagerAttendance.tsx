import React from 'react';
import { attendanceRows } from '../managerDashboardData';
import { Panel, SectionHeader } from '../ManagerDashboardWidgets';

const ManagerAttendance: React.FC = () => (
    <div className="flex flex-col gap-8 pb-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Attendance</h1>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest mt-2">Weekly presence, remote work, and leave markers</p>
        </div>
        <Panel>
            <SectionHeader eyebrow="ATTENDANCE.WEEK" title="Presence Matrix" meta="5 DAY VIEW" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {attendanceRows.map(row => (
                    <div key={row.day} className="border border-gray-200 dark:border-white/10 p-5">
                        <p className="font-black text-2xl text-gray-900 dark:text-white">{row.day}</p>
                        <div className="mt-5 space-y-3 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-[#8a8a8a]">
                            <div className="flex justify-between"><span>Present</span><span>{row.present}</span></div>
                            <div className="flex justify-between"><span>Remote</span><span>{row.remote}</span></div>
                            <div className="flex justify-between"><span>Late</span><span className="text-[#FF9900]">{row.late}</span></div>
                            <div className="flex justify-between"><span>Leave</span><span>{row.leave}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    </div>
);

export default ManagerAttendance;
