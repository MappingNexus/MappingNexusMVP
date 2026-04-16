import React from 'react';

interface Props { message?: string; }

const LoadingSpinner: React.FC<Props> = ({ message = 'Loading...' }) => (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="relative w-10 h-10">
            <div className="absolute inset-0 border border-[#2A2A2A]"></div>
            <div className="absolute inset-0 border border-transparent border-t-[#00FF66] animate-spin"></div>
        </div>
        <p className="text-[#8A8A8A] font-mono text-[10px] uppercase tracking-widest animate-pulse">{message}</p>
    </div>
);

export default LoadingSpinner;
