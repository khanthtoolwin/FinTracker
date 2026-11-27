import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getTodayIsoDate } from '../lib/analytics';
import { CURRENCY_CONFIG, convertAmount } from '../lib/currency';
import { validateExpenseInput } from '../lib/expenseStore';
import {
  CurrencyCode,
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  ExpenseInput,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../types/expense';

interface ExpenseDrawerProps {
  open: boolean;
  editingExpense: Expense | null;
  activeCurrency: CurrencyCode;
  onClose: () => void;
  onSubmit: (input: ExpenseInput, editingId: string | null) => Promise<void>;
}

export function ExpenseDrawer({
  open,
  editingExpense,
  activeCurrency,
  onClose,
  onSubmit,
}: ExpenseDrawerProps) {
  const currencyMeta = CURRENCY_CONFIG[activeCurrency];
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [expenseDate, setExpenseDate] = useState(getTodayIsoDate());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (editingExpense) {
      setTitle(editingExpense.title);
      const converted = convertAmount(
        editingExpense.amount,
        editingExpense.currency,
        activeCurrency
      );
      setAmount(converted.toFixed(currencyMeta.decimals));
      setCategory(editingExpense.category);
      setExpenseDate(editingExpense.expenseDate);
      setPaymentMethod(editingExpense.paymentMethod);
      setNotes(editingExpense.notes);
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food & Dining');
      setExpenseDate(getTodayIsoDate());
      setPaymentMethod('Card');
      setNotes('');
    }
    setError(null);
  }, [open, editingExpense, activeCurrency, currencyMeta.decimals]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, submitting, onClose]);

  async function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const candidate: ExpenseInput = {
      title,
      amount: Number(amount),
      currency: activeCurrency,
      category,
      expenseDate,
      paymentMethod,
      notes,
    };

    const validation = validateExpenseInput(candidate);
    if (!validation.valid || !validation.sanitized) {
      setError(validation.error ?? 'Please check the expense fields.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(validation.sanitized, editingExpense?.id ?? null);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save expense. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => {
              if (!submitting) {
                onClose();
              }
            }}
            className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-drawer-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#222A32] bg-[#0F1419] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#222A32] bg-[#13181D] px-6 py-4">
              <div>
                <h2
                  id="expense-drawer-title"
                  className="font-display text-lg font-semibold text-[#F1F5F9]"
                >
                  {editingExpense ? 'Edit Notebook Entry' : 'Log New Expense'}
                </h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {editingExpense
                    ? 'Update amount, date, or category details'
                    : 'Record a daily expense in your notebook'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close drawer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="flex flex-1 flex-col justify-between overflow-y-auto px-6 py-6"
            >
              <div className="space-y-5">
                {error && (
                  <div
                    role="alert"
                    className="rounded-md border border-[#F87171]/30 bg-[#7F1D1D]/25 px-3.5 py-2.5 text-xs font-medium text-[#FCA5A5]"
                  >
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="expense-amount"
                    className="block text-xs font-medium text-[#94A3B8]"
                  >
                    Amount ({activeCurrency})
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-tabular text-base font-medium text-[#7C8896]">
                      {currencyMeta.symbol}
                    </span>
                    <input
                      id="expense-amount"
                      type="number"
                      step={currencyMeta.decimals === 0 ? '1' : '0.01'}
                      min={currencyMeta.decimals === 0 ? '1' : '0.01'}
                      required
                      autoFocus
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={currencyMeta.decimals === 0 ? '0' : '0.00'}
                      className={`h-12 w-full rounded-md border border-[#222A32] bg-[#13181D] ${
                        activeCurrency === 'MMK' ? 'pl-10' : 'pl-8'
                      } pr-4 font-mono-tabular text-lg font-semibold text-[#F1F5F9] placeholder:text-[#7C8896] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="expense-title"
                    className="block text-xs font-medium text-[#94A3B8]"
                  >
                    Description / Merchant
                  </label>
                  <input
                    id="expense-title"
                    type="text"
                    required
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Blue Bottle Coffee, Trader Joe's"
                    className="mt-1.5 h-10 w-full rounded-md border border-[#222A32] bg-[#13181D] px-3.5 text-sm text-[#F1F5F9] placeholder:text-[#7C8896] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expense-category"
                      className="block text-xs font-medium text-[#94A3B8]"
                    >
                      Category
                    </label>
                    <select
                      id="expense-category"
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as ExpenseCategory)
                      }
                      className="mt-1.5 h-10 w-full rounded-md border border-[#222A32] bg-[#13181D] px-3 text-sm text-[#F1F5F9] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                    >
                      {EXPENSE_CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="expense-date"
                      className="block text-xs font-medium text-[#94A3B8]"
                    >
                      Date
                    </label>
                    <input
                      id="expense-date"
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-md border border-[#222A32] bg-[#13181D] px-3 font-mono-tabular text-sm text-[#F1F5F9] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#94A3B8]">
                    Payment Method
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`h-9 rounded-md border px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                          paymentMethod === method
                            ? 'border-[#34D399]/60 bg-[#34D399]/10 text-[#34D399]'
                            : 'border-[#222A32] bg-[#13181D] text-[#94A3B8] hover:border-[#2E3944] hover:text-[#F1F5F9]'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="expense-notes"
                    className="block text-xs font-medium text-[#94A3B8]"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="expense-notes"
                    rows={3}
                    maxLength={500}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add context, receipt details, or split notes..."
                    className="mt-1.5 w-full rounded-md border border-[#222A32] bg-[#13181D] px-3.5 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#7C8896] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#222A32] pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="h-10 rounded-md border border-[#222A32] bg-[#13181D] px-4 text-sm font-medium text-[#F1F5F9] hover:bg-[#1A2129] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 rounded-md bg-[#10B981] px-5 text-sm font-semibold text-[#042F21] hover:bg-[#34D399] disabled:opacity-60 transition-colors"
                >
                  {submitting
                    ? 'Saving...'
                    : editingExpense
                      ? 'Update Entry'
                      : 'Save Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
