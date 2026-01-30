import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';

interface EarningsMetric {
  label: string;
  value: number;
  period: string;
}

interface EarningsGridProps {
  metrics: {
    perDay: number;
    perWeek: number;
    perMonth: number;
    perQuarter: number;
    perYear: number;
    lifetime: number;
  };
}

export const EarningsGrid: React.FC<EarningsGridProps> = ({ metrics }) => {
  const earningsData: EarningsMetric[] = [
    { label: 'Per Day', value: metrics.perDay, period: 'Daily' },
    { label: 'Per Week', value: metrics.perWeek, period: 'Weekly' },
    { label: 'Per Month', value: metrics.perMonth, period: 'Monthly' },
    { label: 'Per Quarter', value: metrics.perQuarter, period: 'Quarterly' },
    { label: 'Per Year', value: metrics.perYear, period: 'Yearly' },
    { label: 'Lifetime Earnings', value: metrics.lifetime, period: 'All Time' },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-900/30 border border-green-700 rounded flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Revenue Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {earningsData.map((metric, idx) => (
          <div
            key={idx}
            className="bg-black border border-zinc-800 p-6 hover:border-zinc-700 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-mono uppercase text-zinc-500 mb-1">
                  {metric.period}
                </p>
                <h3 className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                  {metric.label}
                </h3>
              </div>
              <DollarSign className="w-4 h-4 text-zinc-600 group-hover:text-green-400 transition-colors" />
            </div>

            <div className="space-y-2">
              <div className="text-3xl font-light text-white tracking-tight">
                ${metric.value.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              
              {/* Subtle progress indicator for non-lifetime metrics */}
              {metric.label !== 'Lifetime Earnings' && (
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-zinc-600 to-zinc-500 transition-all"
                    style={{ width: `${Math.min((metric.value / metrics.lifetime) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
