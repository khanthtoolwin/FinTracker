import { CurrencyCode, Expense } from '../types/expense';
import { CURRENCY_CONFIG, convertAmount } from './currency';

function sanitizeCsvCell(value: string | number): string {
  const raw = String(value ?? '');
  const trimmed = raw.trimStart();
  const safe =
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@') ||
    raw.startsWith('\t') ||
    raw.startsWith('\r')
      ? `'${raw}`
      : raw;

  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildExpensesCsv(
  expenses: Expense[],
  currency: CurrencyCode = 'USD'
): string {
  const decimals = CURRENCY_CONFIG[currency].decimals;
  const headers = [
    'Date',
    'Description',
    'Category',
    'Payment Method',
    `Amount (${currency})`,
    'Notes',
  ];

  const rows = expenses.map((expense) => {
    const converted = convertAmount(expense.amount, expense.currency, currency);
    return [
      sanitizeCsvCell(expense.expenseDate),
      sanitizeCsvCell(expense.title),
      sanitizeCsvCell(expense.category),
      sanitizeCsvCell(expense.paymentMethod),
      sanitizeCsvCell(converted.toFixed(decimals)),
      sanitizeCsvCell(expense.notes),
    ].join(',');
  });

  return `\uFEFF${[headers.map(sanitizeCsvCell).join(','), ...rows].join('\r\n')}`;
}

export function downloadExpensesCsv(
  expenses: Expense[],
  filename: string,
  currency: CurrencyCode = 'USD'
): void {
  const csvContent = buildExpensesCsv(expenses, currency);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadExpensesJson(expenses: Expense[], filename: string): void {
  const jsonContent = JSON.stringify(expenses, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
