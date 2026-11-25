import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { formatCurrency, formatLedgerDate, getMonthLabel } from '../lib/analytics';
import { convertAmount } from '../lib/currency';
import { CATEGORY_CHART_COLORS, CurrencyCode, Expense } from '../types/expense';

interface ExpenseLedgerProps {
  expenses: Expense[];
  loading: boolean;
  activeMonth: string;
  activeCurrency: CurrencyCode;
  isFiltered: boolean;
  hasAnyExpensesInWorkspace: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
  onResetFilters: () => void;
  onLogFirstExpense: () => void;
  compactHeader?: boolean;
  onViewFullLedger?: () => void;
}

export function ExpenseLedger({
  expenses,
  loading,
  activeMonth,
  activeCurrency,
  isFiltered,
  hasAnyExpensesInWorkspace,
  onEdit,
  onDelete,
  onResetFilters,
  onLogFirstExpense,
  compactHeader = false,
  onViewFullLedger,
}: ExpenseLedgerProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleConfirmDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <section
      aria-label="Daily expense ledger"
      className="border border-[#E7E5E0] bg-white rounded-lg overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E5E0] px-5 py-4 bg-white">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#18181B]">
            {compactHeader ? 'Recent Notebook Entries' : 'Expense Ledger'}
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            {getMonthLabel(activeMonth)} · Chronological transaction record
          </p>
        </div>

        {compactHeader && onViewFullLedger && (
          <button
            type="button"
            onClick={onViewFullLedger}
            className="text-xs font-medium text-[#166534] hover:underline whitespace-nowrap"
          >
            Open Full Ledger
          </button>
        )}
      </div>

      {loading ? (
        <div className="divide-y divide-[#E7E5E0] bg-white">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 px-5 py-3.5 animate-pulse"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="h-3.5 w-14 rounded bg-[#EFECE6]" />
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <div className="h-4 w-44 rounded bg-[#EFECE6]" />
                  <div className="h-3 w-28 rounded bg-[#F4F2ED]" />
                </div>
              </div>
              <div className="h-4 w-16 rounded bg-[#EFECE6]" />
            </div>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="notebook-ruled px-6 py-14 text-center">
          {isFiltered ? (
            <>
              <p className="font-display text-lg font-semibold text-[#18181B]">
                No entries match your filters
              </p>
              <p className="mt-1.5 text-sm text-[#57534E] max-w-md mx-auto">
                Try adjusting your search query, category filter, or date window.
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-5 inline-flex items-center rounded-md border border-[#E7E5E0] bg-white px-4 py-2 text-xs font-medium text-[#18181B] hover:bg-[#F4F2ED] transition-colors"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-semibold text-[#18181B]">
                {hasAnyExpensesInWorkspace
                  ? `Blank page for ${getMonthLabel(activeMonth)}`
                  : 'Start your FinTracker notebook'}
              </p>
              <p className="mt-1.5 text-sm text-[#57534E] max-w-md mx-auto">
                Record your daily coffee, groceries, transit, or bills. Each entry updates your monthly rhythm and category totals right away.
              </p>
              <button
                type="button"
                onClick={onLogFirstExpense}
                className="mt-5 inline-flex items-center rounded-md bg-[#166534] px-4 py-2 text-xs font-medium text-white hover:bg-[#14532D] transition-colors"
              >
                Log First Expense
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto notebook-ruled">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E7E5E0] bg-[#FAF9F6]/80 text-[11px] font-semibold text-[#57534E]">
                <th className="py-2.5 pl-5 pr-3 w-24 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3">Entry &amp; Category</th>
                <th className="hidden md:table-cell py-2.5 px-3 w-36 whitespace-nowrap">
                  Method
                </th>
                <th className="py-2.5 px-3 text-right w-32 whitespace-nowrap">
                  Amount
                </th>
                <th className="py-2.5 pl-3 pr-5 text-right w-32 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E0]/80">
              <AnimatePresence initial={false}>
                {expenses.map((expense) => {
                  const isConfirming = confirmDeleteId === expense.id;
                  const isDeleting = deletingId === expense.id;
                  const accentColor = CATEGORY_CHART_COLORS[expense.category];

                  return (
                    <motion.tr
                      key={expense.id}
                      layout="position"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="group hover:bg-[#FAF9F6]/90 transition-colors"
                    >
                      <td className="py-3 pl-5 pr-3 align-top font-mono-tabular text-xs text-[#57534E] whitespace-nowrap">
                        {formatLedgerDate(expense.expenseDate)}
                      </td>
                      <td className="py-3 px-3 align-top min-w-[200px]">
                        <div className="flex items-start gap-2.5">
                          <span
                            aria-hidden="true"
                            className="mt-1.5 h-2 w-2 rounded-xs shrink-0"
                            style={{ backgroundColor: accentColor }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#18181B] leading-snug">
                              {expense.title}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#57534E]">
                              <span>{expense.category}</span>
                              <span className="md:hidden" aria-hidden="true">
                                ·
                              </span>
                              <span className="md:hidden">{expense.paymentMethod}</span>
                              {expense.notes && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-[#78716C] truncate max-w-sm">
                                    {expense.notes}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell py-3 px-3 align-top text-xs text-[#57534E] whitespace-nowrap">
                        {expense.paymentMethod}
                      </td>
                      <td className="py-3 px-3 align-top text-right font-mono-tabular text-sm font-semibold text-[#18181B] whitespace-nowrap">
                        {formatCurrency(
                          convertAmount(
                            expense.amount,
                            expense.currency,
                            activeCurrency
                          ),
                          activeCurrency
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-5 align-top text-right whitespace-nowrap">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleConfirmDelete(expense.id)}
                              className="px-2 py-1 text-[11px] font-medium text-white bg-[#DC2626] rounded hover:bg-[#B91C1C] disabled:opacity-50"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-[11px] font-medium text-[#57534E] hover:text-[#18181B]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit(expense)}
                              aria-label={`Edit ${expense.title}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded text-[#57534E] hover:bg-[#EFECE6] hover:text-[#18181B] transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(expense.id)}
                              aria-label={`Delete ${expense.title}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded text-[#57534E] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
