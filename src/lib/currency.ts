import { CurrencyCode, SUPPORTED_CURRENCIES } from '../types/expense';

export interface CurrencyMeta {
  code: CurrencyCode;
  name: string;
  optionLabel: string;
  symbol: string;
  rateFromUsd: number;
  decimals: 0 | 2;
}

export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyMeta> = {
  USD: {
    code: 'USD',
    name: 'US Dollars',
    optionLabel: 'US Dollars ($)',
    symbol: '$',
    rateFromUsd: 1,
    decimals: 2,
  },
  THB: {
    code: 'THB',
    name: 'Thai Baht',
    optionLabel: 'Thai Baht (฿)',
    symbol: '฿',
    rateFromUsd: 34.5,
    decimals: 2,
  },
  MMK: {
    code: 'MMK',
    name: 'Burmese MMK',
    optionLabel: 'Burmese MMK (Ks)',
    symbol: 'Ks',
    rateFromUsd: 4400,
    decimals: 0,
  },
};

const LOCAL_CURRENCY_STORAGE_KEY = 'fintracker_currency_v1';

const numberFormatters: Record<CurrencyCode, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  THB: new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  MMK: new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
};

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function normalizeCurrency(value: unknown): CurrencyCode {
  if (
    typeof value === 'string' &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
  ) {
    return value as CurrencyCode;
  }
  return 'USD';
}

export function roundCurrencyAmount(
  amount: number,
  currency: CurrencyCode
): number {
  const safe = Number.isFinite(amount) ? amount : 0;
  const factor = CURRENCY_CONFIG[currency].decimals === 0 ? 1 : 100;
  return Math.round(safe * factor) / factor;
}

export function convertRawAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (fromCurrency === toCurrency) {
    return safe;
  }
  const usdAmount = safe / CURRENCY_CONFIG[fromCurrency].rateFromUsd;
  return usdAmount * CURRENCY_CONFIG[toCurrency].rateFromUsd;
}

export function convertAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  return roundCurrencyAmount(
    convertRawAmount(amount, fromCurrency, toCurrency),
    toCurrency
  );
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD'
): string {
  const rounded = roundCurrencyAmount(amount, currency);
  const sign = rounded < 0 ? '-' : '';
  const absFormatted = numberFormatters[currency].format(Math.abs(rounded));
  const symbol = CURRENCY_CONFIG[currency].symbol;
  return currency === 'MMK'
    ? `${sign}${symbol} ${absFormatted}`
    : `${sign}${symbol}${absFormatted}`;
}

export function formatCompactCurrency(
  amount: number,
  currency: CurrencyCode = 'USD'
): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const sign = safe < 0 ? '-' : '';
  const absFormatted = compactNumberFormatter.format(Math.abs(safe));
  const symbol = CURRENCY_CONFIG[currency].symbol;
  return currency === 'MMK'
    ? `${sign}${symbol} ${absFormatted}`
    : `${sign}${symbol}${absFormatted}`;
}

export function readStoredCurrency(): CurrencyCode {
  try {
    const raw = window.localStorage.getItem(LOCAL_CURRENCY_STORAGE_KEY);
    return normalizeCurrency(raw);
  } catch {
    return 'USD';
  }
}

export function writeStoredCurrency(currency: CurrencyCode): void {
  try {
    window.localStorage.setItem(LOCAL_CURRENCY_STORAGE_KEY, currency);
  } catch {
    // Ignore storage quota or private browsing errors
  }
}
