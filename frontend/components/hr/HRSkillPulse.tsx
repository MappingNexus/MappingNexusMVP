/**
 * HR Skill Pulse — wraps analytics/skills endpoint
 */
import React, { useEffect, useState } from 'react';
import * as api from '../../services/api';
import type { SkillPulseData } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const HRSkillPulse: React.FC = () => {
    const [data, setData] = useState<SkillPulseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        const loadSkillPulse = async () => {
            const response = await api.getSkillPulse();
            if (!isActive) return;

            if (response.success) {
                setData(response.data);
                setError(null);
            } else {
                setData(null);
                setError(api.getErrorMessage(response, 'Failed to load skill data.'));
            }

            setLoading(false);
        };

        void loadSkillPulse();

        return () => {
            isActive = false;
        };
    }, []);

    if (loading) return <LoadingSpinner message="Loading Skill Pulse..." />;
    if (!data) return <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">{error || 'Failed to load skill data.'}</p>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Skill Pulse</h1>
                <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">Talent density and skill analysis</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Skills */}
                <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase mb-4">Top Skills ({data.topSkills.length})</h3>
                    {data.topSkills.map((s, i) => (
                        <div key={i} className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-900 dark:text-white">{s.name}</span>
                                <span className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">{s.employeeCount} employees</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-[#2a2a2a] h-2">
                                <div className="bg-[#9D4EDD] h-2 transition-all duration-500" style={{ width: `${s.demandScore}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trending */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase">Trending Skills</h3>
                    {data.trendingSkills.map((s, i) => (
                        <div key={i} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 p-5 flex justify-between items-center">
                            <span className="text-gray-900 dark:text-white font-medium">{s.name}</span>
                            <span className="text-blue-500 dark:text-[#00FF66] font-mono text-sm">{s.growthPercent}</span>
                        </div>
                    ))}
                    {data.trendingSkills.length === 0 && (
                        <div className="border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">
                            ➔ No trending data
                        </div>
                    )}
                </div>

                {/* Dormant Skills */}
                <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase mb-4">
                        Dormant Skills <span className="text-[10px] text-gray-500 dark:text-[#8a8a8a] font-mono normal-case tracking-normal">(unused &gt; 90 days)</span>
                    </h3>
                    {data.dormantSkills.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-white/10 last:border-0">
                            <div>
                                <span className="text-gray-900 dark:text-white">{s.name}</span>
                                <span className="text-xs text-gray-500 dark:text-[#8a8a8a] font-mono ml-2">{s.employeeCount} employees • avg {s.avgDaysSinceUsed}d</span>
                            </div>
                            <span className="border border-[#FF9900]/20 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#FF9900] bg-[#FF9900]/10">Dormant</span>
                        </div>
                    ))}
                    {data.dormantSkills.length === 0 && (
                        <div className="border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">
                            ➔ No dormant skills
                        </div>
                    )}
                </div>

                {/* Skill Gaps */}
                <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase mb-4">Skill Gaps</h3>
                    {data.skillGaps.map((g, i) => (
                        <div key={i} className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-900 dark:text-white">{g.name}</span>
                                <span className="text-gray-500 dark:text-[#8a8a8a] font-mono text-xs">Gap: {g.gap}</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-[#2a2a2a] h-1.5">
                                <div className="bg-[#FF3333] h-1.5" style={{ width: `${Math.min(100, (g.gap / Math.max(1, g.total)) * 100)}%` }} />
                            </div>
                        </div>
                    ))}
                    {data.skillGaps.length === 0 && (
                        <div className="border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-gray-500 dark:text-[#8a8a8a] font-mono text-xs uppercase tracking-widest">
                            ➔ No skill gaps detected
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HRSkillPulse;
