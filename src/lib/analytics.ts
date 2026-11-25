import {
  CATEGORY_CHART_COLORS,
  CurrencyCode,
  Expense,
  ExpenseCategory,
  FilterState,
} from '../types/expense';
import {
  convertRawAmount,
  formatCompactCurrency,
  formatCurrency,
  roundCurrencyAmount,
} from './currency';

export { formatCompactCurrency, formatCurrency };

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthKey(): string {
  return getTodayIsoDate().slice(0, 7);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const shifted = new Date(year, monthIndex + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function getDaysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split('-');
  return new Date(Number(yearStr), Number(monthStr), 0).getDate();
}

export function formatLedgerDate(isoDate: string): string {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  if (!yearStr || !monthStr || !dayStr) {
    return isoDate;
  }
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getDefaultFilters(): FilterState {
  return {
    search: '',
    category: 'All',
    datePreset: 'all_month',
    customStart: '',
    customEnd: '',
    sortBy: 'date_desc',
  };
}

export function filterExpenses(
  expenses: Expense[],
  monthKey: string,
  filters: FilterState,
  activeCurrency: CurrencyCode = 'USD'
): Expense[] {
  const searchLower = filters.search.trim().toLowerCase();
  const todayIso = getTodayIsoDate();
  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
  const sevenDaysAgoIso = `${sevenDaysAgoDate.getFullYear()}-${String(
    sevenDaysAgoDate.getMonth() + 1
  ).padStart(2, '0')}-${String(sevenDaysAgoDate.getDate()).padStart(2, '0')}`;

  const matched = expenses.filter((item) => {
    if (filters.datePreset === 'all_month') {
      if (!item.expenseDate.startsWith(monthKey)) {
        return false;
      }
    } else if (filters.datePreset === 'last_7') {
      if (item.expenseDate < sevenDaysAgoIso || item.expenseDate > todayIso) {
        return false;
      }
    } else if (filters.datePreset === 'custom') {
      if (filters.customStart && item.expenseDate < filters.customStart) {
        return false;
      }
      if (filters.customEnd && item.expenseDate > filters.customEnd) {
        return false;
      }
      if (!filters.customStart && !filters.customEnd && !item.expenseDate.startsWith(monthKey)) {
        return false;
      }
    }

    if (filters.category !== 'All' && item.category !== filters.category) {
      return false;
    }

    if (searchLower) {
      const haystack = `${item.title} ${item.notes} ${item.category} ${item.paymentMethod}`.toLowerCase();
      if (!haystack.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  return [...matched].sort((a, b) => {
    switch (filters.sortBy) {
      case 'date_asc':
        return a.expenseDate.localeCompare(b.expenseDate) || a.createdAt.localeCompare(b.createdAt);
      case 'amount_desc':
        return (
          convertRawAmount(b.amount, b.currency, activeCurrency) -
            convertRawAmount(a.amount, a.currency, activeCurrency) ||
          b.expenseDate.localeCompare(a.expenseDate)
        );
      case 'amount_asc':
        return (
          convertRawAmount(a.amount, a.currency, activeCurrency) -
            convertRawAmount(b.amount, b.currency, activeCurrency) ||
          b.expenseDate.localeCompare(a.expenseDate)
        );
      case 'date_desc':
      default:
        return b.expenseDate.localeCompare(a.expenseDate) || b.createdAt.localeCompare(a.createdAt);
    }
  });
}

export interface MonthlySummary {
  totalSpent: number;
  dailyAverage: number;
  transactionCount: number;
  topCategory: ExpenseCategory | null;
  topCategoryAmount: number;
  previousMonthTotal: number;
  monthDeltaPercent: number | null;
}

export function computeMonthlySummary(
  allExpenses: Expense[],
  monthKey: string,
  activeCurrency: CurrencyCode = 'USD'
): MonthlySummary {
  const monthExpenses = allExpenses.filter((item) => item.expenseDate.startsWith(monthKey));
  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const prevMonthExpenses = allExpenses.filter((item) =>
    item.expenseDate.startsWith(prevMonthKey)
  );

  const totalSpent = roundCurrencyAmount(
    monthExpenses.reduce(
      (sum, item) => sum + convertRawAmount(item.amount, item.currency, activeCurrency),
      0
    ),
    activeCurrency
  );
  const previousMonthTotal = roundCurrencyAmount(
    prevMonthExpenses.reduce(
      (sum, item) => sum + convertRawAmount(item.amount, item.currency, activeCurrency),
      0
    ),
    activeCurrency
  );

  const currentMonthKey = getCurrentMonthKey();
  const daysInSelectedMonth = getDaysInMonth(monthKey);
  const elapsedDays =
    monthKey === currentMonthKey
      ? Math.max(1, new Date().getDate())
      : daysInSelectedMonth;

  const dailyAverage = totalSpent > 0 ? roundCurrencyAmount(totalSpent / elapsedDays, activeCurrency) : 0;

  const categoryTotals = new Map<ExpenseCategory, number>();
  for (const item of monthExpenses) {
    const converted = convertRawAmount(item.amount, item.currency, activeCurrency);
    categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + converted);
  }

  let topCategory: ExpenseCategory | null = null;
  let topCategoryAmount = 0;
  for (const [category, amount] of categoryTotals.entries()) {
    if (amount > topCategoryAmount) {
      topCategory = category;
      topCategoryAmount = roundCurrencyAmount(amount, activeCurrency);
    }
  }

  const monthDeltaPercent =
    previousMonthTotal > 0
      ? ((totalSpent - previousMonthTotal) / previousMonthTotal) * 100
      : null;

  return {
    totalSpent,
    dailyAverage,
    transactionCount: monthExpenses.length,
    topCategory,
    topCategoryAmount,
    previousMonthTotal,
    monthDeltaPercent,
  };
}

export interface DailySeriesPoint {
  day: number;
  label: string;
  date: string;
  amount: number;
  count: number;
}

export function buildDailySpendingSeries(
  monthExpenses: Expense[],
  monthKey: string,
  activeCurrency: CurrencyCode = 'USD'
): DailySeriesPoint[] {
  const days = getDaysInMonth(monthKey);
  const byDay = new Map<number, { amount: number; count: number }>();

  for (const item of monthExpenses) {
    if (!item.expenseDate.startsWith(monthKey)) {
      continue;
    }
    const dayNum = Number(item.expenseDate.slice(8, 10));
    if (!Number.isFinite(dayNum)) {
      continue;
    }
    const existing = byDay.get(dayNum) ?? { amount: 0, count: 0 };
    byDay.set(dayNum, {
      amount: existing.amount + convertRawAmount(item.amount, item.currency, activeCurrency),
      count: existing.count + 1,
    });
  }

  const series: DailySeriesPoint[] = [];
  for (let day = 1; day <= days; day += 1) {
    const padded = String(day).padStart(2, '0');
    const bucket = byDay.get(day) ?? { amount: 0, count: 0 };
    series.push({
      day,
      label: String(day),
      date: `${monthKey}-${padded}`,
      amount: roundCurrencyAmount(bucket.amount, activeCurrency),
      count: bucket.count,
    });
  }
  return series;
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  amount: number;
  count: number;
  share: number;
  color: string;
}

export function buildCategoryBreakdown(
  expenses: Expense[],
  activeCurrency: CurrencyCode = 'USD'
): CategoryBreakdownItem[] {
  const map = new Map<ExpenseCategory, { amount: number; count: number }>();
  let total = 0;

  for (const item of expenses) {
    const converted = convertRawAmount(item.amount, item.currency, activeCurrency);
    total += converted;
    const existing = map.get(item.category) ?? { amount: 0, count: 0 };
    map.set(item.category, {
      amount: existing.amount + converted,
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries())
    .map(([category, stats]) => ({
      category,
      amount: roundCurrencyAmount(stats.amount, activeCurrency),
      count: stats.count,
      share: total > 0 ? (stats.amount / total) * 100 : 0,
      color: CATEGORY_CHART_COLORS[category],
    }))
    .sort((a, b) => b.amount - a.amount);
}
