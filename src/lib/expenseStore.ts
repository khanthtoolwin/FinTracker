import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  ExpenseInput,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../types/expense';
import {
  CURRENCY_CONFIG,
  normalizeCurrency,
  roundCurrencyAmount,
} from './currency';
import { isSupabaseConfigured, supabase } from './supabase';

const LOCAL_STORAGE_KEY = 'fintracker_local_expenses_v1';

interface SupabaseExpenseRow {
  id: string;
  user_id: string;
  title: string;
  amount: number | string;
  currency?: string | null;
  category: string;
  expense_date: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeCategory(value: string): ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value)
    ? (value as ExpenseCategory)
    : 'Other';
}

function normalizePaymentMethod(value: string): PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value)
    ? (value as PaymentMethod)
    : 'Card';
}

function mapSupabaseRow(row: SupabaseExpenseRow): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    amount: Number(row.amount),
    currency: normalizeCurrency(row.currency),
    category: normalizeCategory(row.category),
    expenseDate: row.expense_date,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateExpenseInput(input: ExpenseInput): {
  valid: boolean;
  error?: string;
  sanitized?: ExpenseInput;
} {
  const title = input.title.trim();
  if (!title || title.length > 120) {
    return {
      valid: false,
      error: 'Enter a description between 1 and 120 characters.',
    };
  }

  const currency = normalizeCurrency(input.currency);
  const amount = Number(input.amount);
  const symbol = CURRENCY_CONFIG[currency].symbol;

  if (currency === 'MMK') {
    if (!Number.isFinite(amount) || amount < 1 || amount > 999999999) {
      return {
        valid: false,
        error: `Enter a valid amount of at least ${symbol} 1.`,
      };
    }
    if (!Number.isInteger(amount)) {
      return {
        valid: false,
        error: 'Burmese MMK amounts must be whole numbers (no decimals).',
      };
    }
  } else if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999.99) {
    return {
      valid: false,
      error: `Enter a valid amount greater than ${symbol}0.00.`,
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate)) {
    return {
      valid: false,
      error: 'Choose a valid calendar date.',
    };
  }

  const notes = input.notes.trim();
  if (notes.length > 500) {
    return {
      valid: false,
      error: 'Notes must be 500 characters or fewer.',
    };
  }

  return {
    valid: true,
    sanitized: {
      title,
      amount: roundCurrencyAmount(amount, currency),
      currency,
      category: normalizeCategory(input.category),
      expenseDate: input.expenseDate,
      paymentMethod: normalizePaymentMethod(input.paymentMethod),
      notes,
    },
  };
}

function readLocalExpenses(): Expense[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (item): item is Expense =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.amount === 'number' &&
          typeof item.expenseDate === 'string'
      )
      .map((item) => ({
        ...item,
        currency: normalizeCurrency(item.currency),
        category: normalizeCategory(item.category),
        paymentMethod: normalizePaymentMethod(item.paymentMethod),
        notes: typeof item.notes === 'string' ? item.notes : '',
        createdAt:
          typeof item.createdAt === 'string'
            ? item.createdAt
            : new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function writeLocalExpenses(expenses: Expense[]): void {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
}

export async function fetchExpenses(userId: string | null): Promise<Expense[]> {
  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from('expenses')
      .select(
        'id, user_id, title, amount, currency, category, expense_date, payment_method, notes, created_at, updated_at'
      )
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as SupabaseExpenseRow[]).map(mapSupabaseRow);
  }

  return readLocalExpenses();
}

export async function createExpense(
  input: ExpenseInput,
  userId: string | null
): Promise<Expense> {
  const validation = validateExpenseInput(input);
  if (!validation.valid || !validation.sanitized) {
    throw new Error(validation.error ?? 'Invalid expense details.');
  }
  const clean = validation.sanitized;

  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        title: clean.title,
        amount: clean.amount,
        currency: clean.currency,
        category: clean.category,
        expense_date: clean.expenseDate,
        payment_method: clean.paymentMethod,
        notes: clean.notes || null,
      })
      .select(
        'id, user_id, title, amount, currency, category, expense_date, payment_method, notes, created_at, updated_at'
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Unable to save expense. Please try again.');
    }

    return mapSupabaseRow(data as SupabaseExpenseRow);
  }

  const now = new Date().toISOString();
  const created: Expense = {
    id: crypto.randomUUID(),
    title: clean.title,
    amount: clean.amount,
    currency: clean.currency,
    category: clean.category,
    expenseDate: clean.expenseDate,
    paymentMethod: clean.paymentMethod,
    notes: clean.notes,
    createdAt: now,
    updatedAt: now,
  };

  const current = readLocalExpenses();
  writeLocalExpenses([created, ...current]);
  return created;
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
  userId: string | null
): Promise<Expense> {
  const validation = validateExpenseInput(input);
  if (!validation.valid || !validation.sanitized) {
    throw new Error(validation.error ?? 'Invalid expense details.');
  }
  const clean = validation.sanitized;

  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        title: clean.title,
        amount: clean.amount,
        currency: clean.currency,
        category: clean.category,
        expense_date: clean.expenseDate,
        payment_method: clean.paymentMethod,
        notes: clean.notes || null,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(
        'id, user_id, title, amount, currency, category, expense_date, payment_method, notes, created_at, updated_at'
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Unable to update expense. Please try again.');
    }

    return mapSupabaseRow(data as SupabaseExpenseRow);
  }

  const current = readLocalExpenses();
  let updatedItem: Expense | null = null;
  const next = current.map((item) => {
    if (item.id !== id) {
      return item;
    }
    updatedItem = {
      ...item,
      ...clean,
      updatedAt: new Date().toISOString(),
    };
    return updatedItem;
  });

  if (!updatedItem) {
    throw new Error('Expense entry could not be found.');
  }

  writeLocalExpenses(next);
  return updatedItem;
}

export async function deleteExpense(
  id: string,
  userId: string | null
): Promise<void> {
  if (isSupabaseConfigured && supabase && userId) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const current = readLocalExpenses();
  writeLocalExpenses(current.filter((item) => item.id !== id));
}

export function clearLocalExpenses(): void {
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}
