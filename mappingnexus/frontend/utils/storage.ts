import { CustomerRecord, Transaction, Employee } from '../types';

interface UserCredentials {
  email: string;
  password: string;
}

interface UserEmployeeDB {
  [userEmail: string]: Employee[];
}

const STORAGE_KEYS = {
  USER_CREDENTIALS: 'nexus_user_credentials',
  CUSTOMER_DB: 'nexus_customer_db',
  USER_EMPLOYEE_DB: 'nexus_user_employee_db',
  TRANSACTIONS_DB: 'nexus_transactions_db',
} as const;

// Default/Initial data
export const DEFAULT_CREDENTIALS: UserCredentials[] = [
  { email: 'tdhairyakumar@gmail.com', password: 'Dktwr@123' }
];

export const DEFAULT_CUSTOMERS: CustomerRecord[] = [
  { 
    email: 'corp.client@alpha.com', 
    monthlySpend: 225, 
    status: 'Active', 
    isRevenueCounted: true, 
    lastPaymentDate: new Date().toISOString(),
    accessExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isSubscribed: true,
    accessLevel: 'Standard'
  },
  { 
    email: 'startup.ceo@beta.io', 
    monthlySpend: 225, 
    status: 'Expired', 
    isRevenueCounted: true, 
    lastPaymentDate: '2023-10-01T00:00:00.000Z',
    isSubscribed: false,
    accessLevel: 'Standard'
  },
  { 
    email: 'enterprise.lead@omega.com', 
    monthlySpend: 0, 
    status: 'Lead', 
    isRevenueCounted: false, 
    accessLevel: 'Standard',
    isSubscribed: false,
    proposedBudget: '5000',
    flexibleAgreement: true
  },
  { 
    email: 'tdhairyakumar@gmail.com', 
    monthlySpend: 0, 
    status: 'Active', 
    isRevenueCounted: false, 
    lastPaymentDate: new Date().toISOString(),
    accessExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isSubscribed: true,
    accessLevel: 'VIP'
  },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-001',
    email: 'corp.client@alpha.com',
    amount: 225,
    transactionDate: new Date().toISOString(),
    approvedBy: 'tdhairyakumar@gmail.com',
    status: 'Completed'
  }
];

export const DEFAULT_EMPLOYEE_DB: UserEmployeeDB = {};

/**
 * Load user credentials from localStorage, or return defaults
 */
export const loadUserCredentials = (): UserCredentials[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load user credentials from localStorage:', error);
  }
  return DEFAULT_CREDENTIALS;
};

/**
 * Save user credentials to localStorage
 */
export const saveUserCredentials = (credentials: UserCredentials[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save user credentials to localStorage:', error);
  }
};

/**
 * Load customer database from localStorage, or return defaults
 */
export const loadCustomerDB = (): CustomerRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMER_DB);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load customer database from localStorage:', error);
  }
  return DEFAULT_CUSTOMERS;
};

/**
 * Save customer database to localStorage
 */
export const saveCustomerDB = (customers: CustomerRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_DB, JSON.stringify(customers));
  } catch (error) {
    console.error('Failed to save customer database to localStorage:', error);
  }
};

/**
 * Load per-user employee database from localStorage, or return empty
 */
export const loadUserEmployeeDB = (): UserEmployeeDB => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_EMPLOYEE_DB);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load user employee database from localStorage:', error);
  }
  return DEFAULT_EMPLOYEE_DB;
};

/**
 * Save per-user employee database to localStorage
 */
export const saveUserEmployeeDB = (employeeDB: UserEmployeeDB): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_EMPLOYEE_DB, JSON.stringify(employeeDB));
  } catch (error) {
    console.error('Failed to save user employee database to localStorage:', error);
  }
};

/**
 * Load transactions database from localStorage, or return defaults
 */
export const loadTransactionsDB = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS_DB);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load transactions database from localStorage:', error);
  }
  return DEFAULT_TRANSACTIONS;
};

/**
 * Save transactions database to localStorage
 */
export const saveTransactionsDB = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_DB, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save transactions database to localStorage:', error);
  }
};

/**
 * Clear ALL app data from localStorage (useful for testing/reset)
 */
export const clearAllAppData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('All app data cleared from localStorage');
  } catch (error) {
    console.error('Failed to clear app data from localStorage:', error);
  }
};

/**
 * Get storage stats (size, number of items)
 */
export const getStorageStats = (): { totalItems: number; totalSize: string } => {
  let totalSize = 0;
  let itemCount = 0;

  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      itemCount++;
      totalSize += item.length;
    }
  });

  const sizeInKB = (totalSize / 1024).toFixed(2);
  return { totalItems: itemCount, totalSize: `${sizeInKB} KB` };
};
