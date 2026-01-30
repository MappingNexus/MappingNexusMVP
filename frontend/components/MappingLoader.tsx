import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface MappingLoaderProps {
  onComplete: () => void;
}

export const MappingLoader: React.FC<MappingLoaderProps> = ({ onComplete }) => {
  const [statusText, setStatusText] = useState('Initiating Connection...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sequence = [
      { text: 'Parsing DNA Structure...', time: 800 },
      { text: 'Indexing Skill Nodes...', time: 1600 },
      { text: 'Mapping Neural Pathways...', time: 2400 },
      { text: 'Optimizing Logistics...', time: 3200 },
      { text: 'Nexus Online.', time: 3800 },
    ];

    // Progress Bar Simulation
    const progressInterval = setInterval(() => {
      setProgress(old => {
        if (old >= 100) return 100;
        return old + 2;
      });
    }, 60);

    // Text Sequence
    sequence.forEach(({ text, time }) => {
      setTimeout(() => setStatusText(text), time);
    });

    // Completion
    setTimeout(() => {
      clearInterval(progressInterval);
      onComplete();
    }, 4000);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
      <div className="relative">
        {/* Animated Logo */}
        <div className="animate-[spin_3s_linear_infinite]">
          <Logo className="w-24 h-24" />
        </div>
        
        {/* Center Pulse */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full animate-ping opacity-20"></div>
      </div>

      <div className="mt-12 text-center w-full max-w-sm">
        <h2 className="text-lg font-mono font-bold uppercase tracking-widest mb-2 animate-pulse">
          {statusText}
        </h2>
        
        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 h-1 mt-6 overflow-hidden">
          <div 
            className="h-full bg-black transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between mt-2 text-[10px] font-mono text-zinc-400">
          <span>SYSTEM_INIT</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};
