export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Groceries',
  'Utilities & Bills',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'Card',
  'Cash',
  'Bank Transfer',
  'Digital Wallet',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SUPPORTED_CURRENCIES = ['USD', 'THB', 'MMK'] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface Expense {
  id: string;
  userId?: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export type DateRangePreset = 'all_month' | 'last_7' | 'custom';

export interface FilterState {
  search: string;
  category: ExpenseCategory | 'All';
  datePreset: DateRangePreset;
  customStart: string;
  customEnd: string;
  sortBy: SortOption;
}

export type NavSection = 'overview' | 'ledger' | 'analytics' | 'setup';

export const CATEGORY_CHART_COLORS: Record<ExpenseCategory, string> = {
  'Food & Dining': '#166534',
  Groceries: '#0F766E',
  Transport: '#1D4ED8',
  'Utilities & Bills': '#334155',
  Shopping: '#B45309',
  Health: '#047857',
  Entertainment: '#6D28D9',
  Other: '#57534E',
};
