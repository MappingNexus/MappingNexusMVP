import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Database, Zap, ArrowRight } from 'lucide-react';
import PublicLayout from '../shared/PublicLayout';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <PublicLayout>
            <main className="w-full max-w-[1500px] mx-auto px-8 pt-20 lg:pt-32 pb-40 flex flex-col items-center">
                <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-0 items-center max-w-[1400px]">
                    
                    {/* Left Column: Typography */}
                    <div className="flex flex-col items-start lg:pr-12 w-full z-20">
                        <div className="flex items-center space-x-2.5 text-[12px] font-bold tracking-widest text-[#666666] dark:text-[#999999] uppercase mb-10">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse"></span>
                            <span>System v2.4 Online</span>
                        </div>
                        
                        <h1 className="text-7xl sm:text-8xl lg:text-[7rem] xl:text-[8rem] leading-[1.02] tracking-tighter font-extrabold text-[#111] dark:text-white whitespace-nowrap">
                            Intelligence,<br/>
                            <span className="text-[#888888] dark:text-[#777777] transition-colors duration-500">Mapped.</span>
                        </h1>
                        
                        <p className="text-[1.4rem] xl:text-[1.6rem] leading-[1.6] text-[#555555] dark:text-[#a0a0a0] font-light mt-10 max-w-[600px]">
                            Orchestrate your workforce data to reveal hidden efficiencies and optimize talent deployment.
                        </p>
                    </div>

                    {/* Right Column: Mockup UI */}
                    <div className="relative w-full aspect-[4/3] max-w-3xl xl:max-w-4xl mx-auto flex items-center justify-center z-10 mt-16 lg:mt-0 transform lg:translate-x-12">
                        <div className="w-full h-auto bg-white/60 dark:bg-[#111111]/70 backdrop-blur-xl rounded-[24px] border border-white/60 dark:border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-6 overflow-hidden 
                            hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.7)] hover:-translate-y-2 transition-all duration-500 ease-out">
                            
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200/50 dark:border-white/5">
                                <div className="flex space-x-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50"></div>
                                </div>
                                <div className="font-mono text-[10px] text-gray-400 dark:text-gray-500 tracking-wider">
                                    nexus_core_monitor.exe
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 dark:border-white/5 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                                    <div className="flex items-center space-x-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                                        <Activity className="w-3 h-3 text-gray-500 dark:text-gray-400"/> <span>Usage</span>
                                    </div>
                                    <div className="text-[28px] font-extrabold text-[#111] dark:text-white mb-4 tracking-tight leading-none">94%</div>
                                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#10b981] w-[94%]"></div>
                                    </div>
                                </div>

                                <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 dark:border-white/5 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                                    <div className="flex items-center space-x-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                                        <Database className="w-3 h-3 text-gray-500 dark:text-gray-400"/> <span>Nodes</span>
                                    </div>
                                    <div className="text-[28px] font-extrabold text-[#111] dark:text-white mb-4 tracking-tight leading-none">12k</div>
                                    <div className="flex space-x-1.5 items-center">
                                        <div className="w-3 h-[3px] bg-[#3b82f6] rounded-full"></div>
                                        <div className="w-3 h-[3px] bg-[#3b82f6] rounded-full"></div>
                                        <div className="w-3 h-[3px] bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    </div>
                                </div>

                                <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 dark:border-white/5 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                                    <div className="flex items-center space-x-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                                        <Zap className="w-3 h-3 text-gray-500 dark:text-gray-400"/> <span>Eff.</span>
                                    </div>
                                    <div className="text-[28px] font-extrabold text-[#111] dark:text-white mb-4 tracking-tight leading-none">+28%</div>
                                    <div className="flex items-center space-x-1.5 text-[9px] font-bold text-[#10b981] tracking-widest">
                                        <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-transparent border-b-[#10b981]"></div>
                                        <span className="uppercase">Optimized</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl px-6 py-8 border border-gray-100 dark:border-white/5 shadow-sm h-[130px] flex items-end justify-between relative group">
                                {[20, 35, 25, 45, 30, 40, 55, 45, 35, 50, 40, 60, 45, 65].map((h, i) => (
                                    <div 
                                        key={i} 
                                        className="w-[4px] sm:w-[6px] md:w-[8px] bg-[#bfdbfe] dark:bg-[#3b82f6] rounded-t-sm opacity-80" 
                                        style={{ height: `${h}%`, transitionDelay: `${i * 30}ms` }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mt-20 lg:mt-32 w-full relative z-20">
                    <button 
                        onClick={() => navigate('/onboard')} 
                        className="w-full sm:w-auto overflow-hidden relative group flex items-center justify-center px-9 py-4 bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] rounded-full font-semibold text-[1.1rem] transition-transform hover:scale-105 active:scale-95 shadow-2xl shadow-black/20 dark:shadow-white/10"
                    >
                        <span className="relative z-10 flex items-center">
                            Deploy System
                            <ArrowRight className="w-5 h-5 ml-2.5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                        </span>
                    </button>
                    
                    <button 
                        onClick={() => navigate('/login')} 
                        className="w-full sm:w-auto px-9 py-4 bg-white dark:bg-[#111111] text-[#111111] dark:text-white rounded-full font-semibold text-[1.1rem] border border-gray-200/80 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/20 transition-all hover:scale-105 active:scale-95 hover:bg-gray-50 dark:hover:bg-[#1a1a1c]"
                    >
                        View Live Demo
                    </button>
                </div>
            </main>
        </PublicLayout>
    );
};

export default LandingPage;
