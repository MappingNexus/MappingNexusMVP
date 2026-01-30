import { PricingTier } from './types';

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'micro',
    name: 'MICRO',
    price: 125,
    capacityLabel: '1 – 25 Nodes',
    description: 'Effective rate: $5.00 / node. Entry-level command.',
    features: [
      'Capacity: 25 Employees',
      'Basic Skill Mapping',
      '100 AI Agent Queries/mo',
      'Standard Support',
      'Single Admin Seat'
    ],
    buttonText: 'INITIALIZE MICRO',
    isPopular: false,
  },
  {
    id: 'foundation',
    name: 'FOUNDATION',
    price: 225,
    capacityLabel: '26 – 50 Nodes',
    description: 'Effective rate: $4.50 / node. Deep profiling baseline.',
    features: [
      'Capacity: 50 Employees',
      'Deep DNA Profiling',
      '500 AI Agent Queries/mo',
      'Project History Integration',
      'Knowledge Gap Analysis'
    ],
    buttonText: 'DEPLOY FOUNDATION',
    isPopular: false,
  },
  {
    id: 'growth',
    name: 'GROWTH',
    price: 400,
    capacityLabel: '51 – 100 Nodes',
    description: 'Effective rate: $4.00 / node. High-velocity utilization.',
    features: [
      'Capacity: 100 Employees',
      'Unlimited AI Queries',
      'Priority AI Response Time',
      'Advanced Utilization Metrics',
      'Dedicated Success Manager'
    ],
    buttonText: 'ACTIVATE GROWTH',
    isPopular: true,
  },
  {
    id: 'elite',
    name: 'ELITE',
    price: 875,
    capacityLabel: '101 – 250 Nodes',
    description: 'Effective rate: $3.50 / node. Global logistics engine.',
    features: [
      'Capacity: 250 Employees',
      'Global Logistics Engine',
      'Skyscanner Integration',
      'Full API Access',
      'Custom Logic Summaries'
    ],
    buttonText: 'ACCESS ELITE',
    isPopular: false,
  }
];
