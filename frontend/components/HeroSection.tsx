import React, { useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, ChevronRight, Database, Layers, Zap } from 'lucide-react';

const AnimatedValue = ({ end, duration = 1500, suffix = '', prefix = '' }: { end: number, duration?: number, suffix?: string, prefix?: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(ease * end));

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <>{prefix}{count}{suffix}</>;
};

export const HeroSection: React.FC = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full min-h-[90vh] bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-white overflow-hidden border-b border-zinc-200 dark:border-zinc-800 flex flex-col justify-center transition-colors duration-300"
        >
            {/* Background Grid & Effects */}
            <div className="absolute inset-0 z-0">
                {/* Dynamic Grid */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
                        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1) 40%, rgba(0,0,0,0))'
                    }}
                />

                {/* Mouse Follow Spot */}
                <div
                    className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none transition-transform duration-75"
                    style={{
                        left: mousePosition.x - 400,
                        top: mousePosition.y - 400,
                    }}
                />

                {/* Ambient Glows */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[128px]" />
            </div>

            <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 flex flex-col pt-32 sm:pt-48">

                <div className="grid lg:grid-cols-2 gap-32 items-center mb-16">
                    {/* Left Column: Text Content */}
                    <div className="flex flex-col items-start text-left">
                        {/* Status Badge */}
                        <div className="animate-fade-in-up mb-8 flex items-center gap-2 text-zinc-500 text-sm font-medium tracking-tight">
                            <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            System v2.4 Online
                        </div>

                        {/* Heading */}
                        <div className="relative mb-8">
                            <h1 className="text-6xl sm:text-8xl md:text-9xl font-semibold tracking-tighter text-zinc-900 dark:text-white pb-2 leading-[1.05] transition-colors duration-300">
                                Intelligence,
                                <br />
                                <span className="text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                                    Mapped.
                                </span>
                            </h1>
                        </div>

                        {/* Description */}
                        <p className="max-w-xl text-xl sm:text-2xl text-zinc-500 mb-8 leading-relaxed font-normal">
                            Orchestrate your workforce data to reveal hidden efficiencies and optimize talent deployment.
                        </p>
                    </div>

                    {/* Right Column: Dashboard Visual */}
                    <div className="w-full flex justify-center lg:justify-end perspective-[2000px] group">
                        <div className="relative w-full max-w-lg lg:max-w-full">
                            {/* Glowing Border */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-xl opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-1000"></div>

                            {/* Card Content */}
                            <div
                                className="relative bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl transform rotate-x-6 lg:rotate-y-[-10deg] lg:rotate-x-6 transition-all duration-700 group-hover:rotate-x-0 group-hover:rotate-y-0"
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Fake UI Header */}
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-6 mb-6 transition-colors duration-300">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                    </div>
                                    <div className="font-mono text-xs text-zinc-500">nexus_core_monitor.exe</div>
                                </div>

                                {/* Fake UI Body */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {/* Metric 1 */}
                                    <div className="col-span-1 bg-zinc-50 dark:bg-black/50 rounded-lg p-6 border border-zinc-200 dark:border-white/5 text-left transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-2 text-zinc-500 dark:text-zinc-400">
                                            <Activity className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="text-[10px] sm:text-xs uppercase font-mono">Usage</span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white transition-colors duration-300">
                                            <AnimatedValue end={94} suffix="%" />
                                        </div>
                                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 mt-3 rounded-full overflow-hidden transition-colors duration-300">
                                            <div className="bg-green-500 h-full w-[94.2%]"></div>
                                        </div>
                                    </div>

                                    {/* Metric 2 */}
                                    <div className="col-span-1 bg-zinc-50 dark:bg-black/50 rounded-lg p-6 border border-zinc-200 dark:border-white/5 text-left transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-2 text-zinc-500 dark:text-zinc-400">
                                            <Database className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="text-[10px] sm:text-xs uppercase font-mono">Nodes</span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white transition-colors duration-300">
                                            <AnimatedValue end={12} suffix="k" />
                                        </div>
                                        <div className="flex gap-1 mt-3">
                                            <span className="h-1 w-2 bg-blue-500 rounded-full"></span>
                                            <span className="h-1 w-2 bg-blue-500/60 rounded-full"></span>
                                            <span className="h-1 w-2 bg-blue-500/30 rounded-full"></span>
                                        </div>
                                    </div>

                                    {/* Metric 3 */}
                                    <div className="col-span-2 sm:col-span-1 bg-zinc-50 dark:bg-black/50 rounded-lg p-6 border border-zinc-200 dark:border-white/5 text-left transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-2 text-zinc-500 dark:text-zinc-400">
                                            <Zap className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="text-[10px] sm:text-xs uppercase font-mono">Eff.</span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white transition-colors duration-300">
                                            <AnimatedValue end={28} prefix="+" suffix="%" />
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-green-500 mt-2 font-mono">▲ OPTIMIZED</div>
                                    </div>

                                    {/* Graph Area */}
                                    <div className="col-span-2 sm:col-span-3 h-32 sm:h-40 bg-zinc-50 dark:bg-black/50 rounded-lg border border-zinc-200 dark:border-white/5 flex items-center justify-center relative overflow-hidden transition-colors duration-300">
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 flex items-end justify-between px-6 sm:px-10 pb-6 gap-2">
                                            {[40, 65, 50, 80, 55, 90, 70, 85, 60, 95, 75, 60, 85, 70, 90].map((h, i) => (
                                                <div key={i} className="w-1.5 sm:w-2 bg-blue-500/30 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Actions - Centered Below */}
                <div className="flex flex-col sm:flex-row gap-4 mb-24 w-full justify-center">
                    <button className="group px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold text-base rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-xl">
                        Deploy System <ArrowRight className="w-5 h-5" />
                    </button>

                    <button className="px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 font-semibold text-base rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        View Live Demo
                    </button>
                </div>
            </div>
        </div>
    );
};
