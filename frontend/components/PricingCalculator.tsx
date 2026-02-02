import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { PRICING_TIERS } from '../constants';
import { Check, Activity, Cpu, Database, Zap } from 'lucide-react';

interface PricingCalculatorProps {
  onPriceUpdate?: (price: number, tierName: string) => void;
  hideButton?: boolean;
}

const AnimatedValue = ({ end, duration = 600, prefix = '', suffix = '' }: { end: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const startValue = count; // Start from current value

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      // Material easing
      const ease = 1 - Math.pow(1 - percentage, 3);

      setCount(startValue + (end - startValue) * ease);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  // Handle integers vs floats display inside the component if needed, 
  // but for now we'll just output count. 
  // Since parent passes 'end' which might be float, we format it in render.
  return <>{prefix}{end % 1 !== 0 ? count.toFixed(2) : Math.round(count)}{suffix}</>;
};

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ onPriceUpdate, hideButton = false }) => {
  const [employees, setEmployees] = useState<number>(15);
  const [debouncedEmployees, setDebouncedEmployees] = useState<number>(15);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Debounce visual effect for calculation simulation
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setDebouncedEmployees(employees);
      setIsCalculating(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [employees]);

  // Calculation Engine
  const calculation = useMemo(() => {
    let rate = 0;
    let tierId = '';

    if (employees <= 25) {
      rate = 5.00;
      tierId = 'micro';
    } else if (employees <= 50) {
      rate = 4.50;
      tierId = 'foundation';
    } else if (employees <= 100) {
      rate = 4.00;
      tierId = 'growth';
    } else if (employees <= 250) {
      rate = 3.50;
      tierId = 'elite';
    } else {
      rate = 0; // Custom
      tierId = 'command';
    }

    const total = employees * rate;
    const tierData = PRICING_TIERS.find(t => t.id === tierId) || {
      id: 'command',
      name: 'COMMAND',
      features: [
        'Unlimited Global Capacity',
        'Dedicated Infrastructure',
        'Custom Logic Engines',
        'On-Premise Deployment Option',
        '24/7 Strategic Support'
      ],
      buttonText: 'CONTACT ENTERPRISE'
    };

    return { rate, total, tierData, isEnterprise: employees > 250 };
  }, [debouncedEmployees]);

  // Notify parent of price change
  useEffect(() => {
    if (onPriceUpdate) {
      onPriceUpdate(calculation.total, calculation.tierData.name);
    }
  }, [calculation.total, calculation.tierData.name, onPriceUpdate]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmployees(parseInt(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0 && val <= 1000) {
      setEmployees(val);
    }
  };

  // Dynamic Glow Color based on Tier
  const getTierColor = () => {
    if (calculation.tierData.id === 'micro') return 'text-blue-400 border-blue-500/50 shadow-blue-500/20';
    if (calculation.tierData.id === 'command') return 'text-purple-400 border-purple-500/50 shadow-purple-500/20';
    return 'text-green-400 border-green-500/50 shadow-green-500/20';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 relative">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/5 shadow-2xl backdrop-blur-xl bg-white dark:bg-[#1E1E1E]">

        {/* Left Panel: Input & Controls */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 relative">

          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Cpu className="w-48 h-48 text-zinc-900 dark:text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <Database className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Resource Configuration</h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-12">
              <div className="flex-1">
                <label className="block text-zinc-600 dark:text-zinc-400 text-sm font-light mb-3">Active Nodes (Employees)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={employees}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-black/50 border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-3xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 font-medium text-xs uppercase">Units</div>
                </div>
              </div>
            </div>

            <div className="mb-12 relative group">
              {/* Dynamic Slider Styles */}
              <style>{`
                /* Webkit Thumb */
                input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  height: 28px;
                  width: 28px;
                  border-radius: 50%;
                  background: #FFFFFF;
                  border: 2px solid #3B82F6;
                  cursor: pointer;
                  margin-top: -12px; /* Center thumb on track (28/2 - 4/2) = 12 */
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                  transition: transform 0.1s ease, box-shadow 0.1s ease;
                }
                input[type=range]:hover::-webkit-slider-thumb {
                  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                  transform: scale(1.05);
                }
                input[type=range]:active::-webkit-slider-thumb {
                  transform: scale(1.1);
                  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2);
                  cursor: grabbing;
                }

                /* Webkit Track - Make transparent so input bg shows */
                input[type=range]::-webkit-slider-runnable-track {
                  width: 100%;
                  height: 4px;
                  cursor: pointer;
                  background: transparent; 
                  border-radius: 2px;
                }

                /* Firefox Thumb */
                input[type=range]::-moz-range-thumb {
                  height: 28px;
                  width: 28px;
                  border-radius: 50%;
                  background: #FFFFFF;
                  border: 2px solid #3B82F6;
                  cursor: pointer;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  transition: transform 0.1s ease;
                }
                input[type=range]:active::-moz-range-thumb {
                  transform: scale(1.1);
                }

                /* Firefox Track */
                input[type=range]::-moz-range-track {
                  width: 100%;
                  height: 4px;
                  cursor: pointer;
                  background: transparent;
                  border-radius: 2px;
                }
              `}</style>

              <input
                type="range"
                min="1"
                max="300"
                value={employees}
                onChange={handleSliderChange}
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #8B5CF6 ${((employees - 1) / 299) * 100}%, rgba(128, 128, 128, 0.2) ${((employees - 1) / 299) * 100}%, rgba(128, 128, 128, 0.2) 100%)`
                }}
                className="w-full h-4 appearance-none cursor-pointer focus:outline-none z-10 relative rounded-full"
              />

              {/* Custom Track Ticks */}
              <div className="flex justify-between mt-3 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider relative">
                <span>1 Node</span>
                <span className="hidden sm:inline">|</span>
                <span>100 Nodes</span>
                <span className="hidden sm:inline">|</span>
                <span>250+ (Enterprise)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-black/20 p-3 rounded-lg w-fit">
              <div className={`relative w-2 h-2 rounded-full ${isCalculating ? 'bg-yellow-500 animate-ping' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                {isCalculating ? 'CALCULATING OPTIMAL RATE...' : 'SYSTEM READY'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Output & Quote */}
        <div className="lg:col-span-5 p-8 sm:p-12 bg-zinc-900 dark:bg-[#121212] text-white flex flex-col justify-between relative overflow-hidden">

          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          ></div>

          <div className={`relative z-10 transition-all duration-500 ${isCalculating ? 'blur-sm opacity-50' : 'opacity-100'}`}>
            <div className="mb-6">
              <span className="inline-block border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-4 rounded-full">
                Recommended Tier
              </span>
              <h3 className={`text-3xl font-bold uppercase tracking-widest mb-1 flexible-text-glow ${getTierColor().split(' ')[0]}`}>
                {calculation.tierData.name}
              </h3>
            </div>

            <div className="py-8 border-y border-white/5 mb-8">
              {calculation.isEnterprise ? (
                <div>
                  <span className="text-4xl sm:text-5xl font-light tracking-tighter text-white">Custom</span>
                  <p className="text-zinc-500 text-xs mt-2 font-medium">Volume-based pricing protocol</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-medium text-zinc-500 -translate-y-6">$</span>
                    <span className="text-5xl sm:text-6xl font-light tracking-tighter text-white">
                      <AnimatedValue end={calculation.total} />
                    </span>
                    <span className="text-xs font-medium text-zinc-500 ml-2">/MO</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <p className="text-zinc-400 text-xs font-medium">
                      Rate: <span className="text-white"><AnimatedValue end={calculation.rate} prefix="$" /></span> per node
                    </p>
                  </div>
                </div>
              )}
            </div>

            <ul className="space-y-4 mb-10">
              {calculation.tierData.features.slice(1).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-4 group">
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                    <Check className="w-3 h-3 text-zinc-400 group-hover:text-blue-400" />
                  </div>
                  <span className="text-sm text-zinc-300 font-light group-hover:text-white transition-colors">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {!hideButton && (
            <div className="relative z-10">
              <button className="w-full group relative px-8 py-4 bg-white text-black font-bold text-xs uppercase tracking-widest overflow-hidden hover:bg-zinc-200 transition-all">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {calculation.tierData.buttonText}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};