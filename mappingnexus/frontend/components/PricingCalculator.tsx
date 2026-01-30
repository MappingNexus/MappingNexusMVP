import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { PRICING_TIERS } from '../constants';
import { Check, Activity, Cpu } from 'lucide-react';

interface PricingCalculatorProps {
  onPriceUpdate?: (price: number, tierName: string) => void;
  hideButton?: boolean;
}

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
    // Find features from constants based on tierId
    // Fallback for custom enterprise tier
    const tierData = PRICING_TIERS.find(t => t.id === tierId) || {
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

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-2 border-nexus-charcoal bg-white shadow-2xl">
        
        {/* Left Panel: Input & Controls */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-nexus-charcoal bg-zinc-50 relative overflow-hidden">
          {/* Background Decorator */}
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Cpu className="w-32 h-32" />
          </div>

          <div className="relative z-10">
            <label className="block text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6">
              Network Size Configuration
            </label>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
              <input
                type="number"
                value={employees}
                onChange={handleInputChange}
                className="w-24 sm:w-32 bg-white border-2 border-black p-3 sm:p-4 text-2xl sm:text-3xl font-bold text-center focus:outline-none focus:bg-zinc-100 transition-colors font-sans"
              />
              <span className="text-sm sm:text-lg font-medium text-black">Active Nodes (Employees)</span>
            </div>

            <div className="mb-12">
              <input
                type="range"
                min="1"
                max="300"
                value={employees}
                onChange={handleSliderChange}
                className="w-full h-2 bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between mt-2 text-[10px] font-mono text-zinc-400 uppercase">
                <span>1 Node</span>
                <span>100 Nodes</span>
                <span>250+ (Enterprise)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-500 animate-pulse">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-mono uppercase">
                Nexus Agent is calculating optimal utility rate...
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Output & Quote */}
        <div className="lg:col-span-5 p-6 sm:p-8 md:p-12 bg-black text-white flex flex-col justify-between relative">
          
          <div className={`transition-opacity duration-300 ${isCalculating ? 'opacity-50' : 'opacity-100'}`}>
            <div className="mb-2">
              <span className="inline-block border border-zinc-700 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-4">
                Recommended Tier
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-1">
                {calculation.tierData.name}
              </h3>
            </div>
            
            <div className="py-6 sm:py-8 border-b border-zinc-800 mb-6 sm:mb-8">
              {calculation.isEnterprise ? (
                <div>
                   <span className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter">Custom</span>
                   <p className="text-zinc-500 text-xs sm:text-sm mt-2 font-mono">Volume-based pricing protocol</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tighter">
                      ${calculation.total.toFixed(0)}
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-zinc-500">/MO</span>
                  </div>
                  <p className="text-zinc-400 text-xs font-mono mt-2">
                    Rate: ${calculation.rate.toFixed(2)} per node
                  </p>
                </div>
              )}
            </div>

            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {calculation.tierData.features.slice(1).map((feature, idx) => ( // Skip the first feature usually capacity
                <li key={idx} className="flex items-start gap-3">
                  <div className="bg-white rounded-full p-0.5 mt-0.5 flex-shrink-0">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-sm text-zinc-300 font-light">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {!hideButton && (
            <Button 
              variant="secondary" 
              fullWidth 
              className="border-none bg-white hover:bg-zinc-200 text-black font-bold text-sm"
            >
              {calculation.tierData.buttonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};