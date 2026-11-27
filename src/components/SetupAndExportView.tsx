import { useState } from 'react';
import { Download, FileSpreadsheet, Trash2 } from 'lucide-react';
import { downloadExpensesCsv } from '../lib/csv';
import { downloadExpensesJson } from '../lib/csv';
import { CURRENCY_CONFIG } from '../lib/currency';
import {
  CurrencyCode,
  Expense,
  SUPPORTED_CURRENCIES,
} from '../types/expense';

interface SetupAndExportViewProps {
  expenses: Expense[];
  activeCurrency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  isSupabaseConfigured: boolean;
  userEmail: string | null;
  onClearLocalData: () => void;
}

export function SetupAndExportView({
  expenses,
  activeCurrency,
  onChangeCurrency,
  isSupabaseConfigured,
  userEmail,
  onClearLocalData,
}: SetupAndExportViewProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="space-y-6">
      <section className="border border-[#222A32] bg-[#13181D] rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
              Workspace Storage
            </h2>
            <p className="mt-1 text-xs text-[#94A3B8]">
              {isSupabaseConfigured
                ? `Cloud sync is active for ${userEmail ?? 'your account'}. Your expenses are saved securely to your account.`
                : 'Running in Local Browser Mode. Your entries are saved in this browser and can be exported anytime as CSV or JSON.'}
            </p>
          </div>
          <span className="text-xs font-mono-tabular font-medium text-[#34D399]">
            {isSupabaseConfigured ? 'Cloud Sync Active' : 'Local Browser Mode'}
          </span>
        </div>
      </section>

      <section className="border border-[#222A32] bg-[#13181D] rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
              Display Currency
            </h2>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Switch between US Dollars, Thai Baht, and Burmese MMK. Existing entries convert automatically using fixed exchange rates.
            </p>
          </div>

          <div
            role="group"
            aria-label="Display currency"
            className="inline-flex flex-wrap items-center rounded-md border border-[#222A32] bg-[#0B0E11] p-0.5"
          >
            {SUPPORTED_CURRENCIES.map((code) => {
              const meta = CURRENCY_CONFIG[code];
              const isSelected = activeCurrency === code;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChangeCurrency(code)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] ${
                    isSelected
                      ? 'bg-[#1A2129] text-[#34D399] font-semibold shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {meta.optionLabel}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-3 text-xs font-mono-tabular text-[#7C8896]">
          Fixed rates: 1 USD = 34.50 THB · 1 USD = 4,400 MMK (whole numbers for MMK)
        </p>
      </section>

      <section className="border border-[#222A32] bg-[#13181D] rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
              Full Notebook Export
            </h2>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Download all {expenses.length} recorded{' '}
              {expenses.length === 1 ? 'entry' : 'entries'} across every month.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={expenses.length === 0}
              onClick={() =>
                downloadExpensesCsv(
                  expenses,
                  'fintracker-all-expenses.csv',
                  activeCurrency
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#10B981] px-4 text-xs font-semibold text-[#042F21] hover:bg-[#34D399] disabled:opacity-45 disabled:pointer-events-none transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>Export All CSV</span>
            </button>

            <button
              type="button"
              disabled={expenses.length === 0}
              onClick={() =>
                downloadExpensesJson(expenses, 'fintracker-backup.json')
              }
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#222A32] bg-[#1A2129] px-4 text-xs font-medium text-[#F1F5F9] hover:border-[#2E3944] hover:bg-[#222A32] disabled:opacity-45 disabled:pointer-events-none transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Export JSON Backup</span>
            </button>
          </div>
        </div>

        {!isSupabaseConfigured && expenses.length > 0 && (
          <div className="mt-5 border-t border-[#222A32] pt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#94A3B8]">
              Clear entries stored in this browser&apos;s local storage.
            </p>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearLocalData();
                    setConfirmClear(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#DC2626] rounded-md hover:bg-[#B91C1C]"
                >
                  Confirm Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FCA5A5] hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear Local Data</span>
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
