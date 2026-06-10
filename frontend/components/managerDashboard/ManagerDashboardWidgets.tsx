import React from 'react';
import { LucideIcon } from 'lucide-react';

export function SectionHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
                <p className="font-mono text-gray-500 dark:text-[#8a8a8a] text-[10px] uppercase tracking-widest mb-1">[ {eyebrow} ]</p>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{title}</h2>
            </div>
            {meta && (
                <span className="w-fit text-gray-500 dark:text-[#8a8a8a] border border-gray-200 dark:border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest">
                    {meta}
                </span>
            )}
        </div>
    );
}

export function MetricCard({
    label,
    value,
    detail,
    tone,
    icon: Icon,
}: {
    label: string;
    value: string;
    detail: string;
    tone: string;
    icon: LucideIcon;
}) {
    return (
        <div className="bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 lg:p-7 min-h-[150px] transition-colors hover:border-gray-300 dark:hover:border-white/25">
            <div className="flex items-start justify-between gap-4">
                <p className="font-mono text-[10px] text-gray-500 dark:text-[#8a8a8a] uppercase tracking-widest">[ {label} ]</p>
                <Icon className={`w-4 h-4 ${tone}`} />
            </div>
            <p className={`text-4xl md:text-5xl font-black mt-5 ${tone}`}>{value}</p>
            <p className="text-gray-500 dark:text-[#8a8a8a] font-mono text-[10px] uppercase tracking-widest mt-4">-&gt; {detail}</p>
        </div>
    );
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <section className={`bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 lg:p-8 ${className}`}>
            {children}
        </section>
    );
}

export function AnalyticsEmptyState() {
    return (
        <div className="min-h-[18rem] flex items-center justify-center border border-dashed border-gray-200 dark:border-white/10 bg-white/30 dark:bg-black/20 px-6 text-center">
            <p className="max-w-md text-sm text-gray-500 dark:text-[#8a8a8a]">
                No data available yet. Add employees or projects to generate analytics.
            </p>
        </div>
    );
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'green' | 'yellow' | 'red' | 'blue' | 'neutral' }) {
    const className = {
        green: 'border-blue-500 dark:border-[#00FF66]/40 text-blue-500 dark:text-[#00FF66] bg-blue-50 dark:bg-[#00FF66]/5',
        yellow: 'border-[#FF9900]/40 text-[#FF9900] bg-[#FF9900]/5',
        red: 'border-[#FF3333]/40 text-[#FF3333] bg-[#FF3333]/5',
        blue: 'border-blue-500/40 text-blue-500 bg-blue-50 dark:bg-blue-500/5',
        neutral: 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-[#8a8a8a] bg-white/30 dark:bg-white/5',
    }[tone];

    return <span className={`inline-flex items-center px-2.5 py-1 border text-[10px] font-mono uppercase tracking-widest ${className}`}>{label}</span>;
}

export function MiniBarChart({ values }: { values: number[] }) {
    return (
        <div className="h-48 flex items-end gap-3 border border-gray-200 dark:border-white/10 p-4 bg-white/30 dark:bg-black/20">
            {values.map((value, index) => (
                <div key={index} className="flex-1 min-w-[10px] flex flex-col items-center gap-2">
                    <div
                        className="w-full bg-blue-500 dark:bg-[#00FF66] opacity-80 transition-all duration-500"
                        style={{ height: `${value}%` }}
                    />
                    <span className="text-[9px] font-mono text-gray-500 dark:text-[#8a8a8a]">{index + 1}</span>
                </div>
            ))}
        </div>
    );
}

export function LoadBar({ value }: { value: number }) {
    const color = value >= 80 ? '#FF3333' : value >= 70 ? '#FF9900' : '#00FF66';

    return (
        <div className="w-full">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-1">
                <span className="text-gray-500 dark:text-[#8a8a8a]">LOAD</span>
                <span style={{ color }}>{value}%</span>
            </div>
            <div className="h-1.5 border border-gray-200 dark:border-white/10">
                <div className="h-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}
