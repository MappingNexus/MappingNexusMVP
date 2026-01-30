import React from 'react';
import { PricingTier } from '../types';
import { Button } from './Button';
import { Check } from 'lucide-react';

interface PricingCardProps {
  tier: PricingTier;
}

export const PricingCard: React.FC<PricingCardProps> = ({ tier }) => {
  const isGrowth = tier.isPopular;

  return (
    <div className={`
      relative flex flex-col h-full
      border-2 transition-all duration-300
      ${isGrowth ? 'border-nexus-charcoal bg-zinc-50 z-10' : 'border-zinc-200 bg-white hover:border-zinc-300'}
      p-6 sm:p-8
    `}>
      {isGrowth && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="bg-nexus-charcoal text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <h3 className="font-sans font-bold text-base sm:text-lg tracking-widest uppercase mb-2">
          {tier.name}
        </h3>
        <p className="font-mono text-xs text-zinc-500 mb-4 sm:mb-6">
          {tier.capacityLabel}
        </p>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-3xl sm:text-4xl font-light tracking-tighter">${tier.price}</span>
          <span className="text-xs font-mono text-zinc-400">/MO</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed min-h-[48px]">
          {tier.description}
        </p>
      </div>

      <div className="flex-grow mb-6 sm:mb-8 border-t border-zinc-100 pt-4 sm:pt-6">
        <ul className="space-y-3 sm:space-y-4">
          {tier.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-zinc-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button variant={isGrowth ? 'primary' : 'outline'} fullWidth>
        {tier.buttonText}
      </Button>
    </div>
  );
};
