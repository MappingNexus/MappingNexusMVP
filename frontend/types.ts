
export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  capacityLabel: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  salary?: number | string | null;
  status: 'Active' | 'On Mission' | 'Travel' | 'On Leave';
  efficiency: number; // 0-100
  location: string;
  skills: string[];
  travelReady: boolean;
  pastMissions: string;
  education: string;
}

export interface CustomerRecord {
  email: string;
  monthlySpend: number;
  status: 'Active' | 'Churned' | 'Expired' | 'Lead';
  isRevenueCounted: boolean;
  lastPaymentDate?: string; // ISO Date String
  accessExpiry?: string; // ISO Date String for access expiration
  isSubscribed?: boolean; // Subscription status flag
  accessLevel: 'Standard' | 'VIP' | 'Admin';
  proposedBudget?: string; // New field for enterprise leads
  flexibleAgreement?: boolean; // New field for enterprise leads
}

export interface Transaction {
  id: string;
  email: string;
  amount: number;
  transactionDate: string; // ISO Date String
  approvedBy: string; // Admin email who approved
  status: 'Completed' | 'Pending' | 'Failed';
}
