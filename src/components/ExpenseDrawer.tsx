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
            className="fixed inset-0 bg-[#18181B]/30 backdrop-blur-[1px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-drawer-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#E7E5E0] bg-[#FAF9F6] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E7E5E0] bg-white px-6 py-4">
              <div>
                <h2
                  id="expense-drawer-title"
                  className="font-display text-lg font-semibold text-[#18181B]"
                >
                  {editingExpense ? 'Edit Notebook Entry' : 'Log New Expense'}
                </h2>
                <p className="text-xs text-[#57534E] mt-0.5">
                  {editingExpense
                    ? 'Update amount, date, or category details'
                    : 'Record a daily transaction in your ledger'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close drawer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#57534E] hover:bg-[#F4F2ED] hover:text-[#18181B] transition-colors"
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
                    className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-medium text-[#DC2626]"
                  >
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="expense-amount"
                    className="block text-xs font-medium text-[#57534E]"
                  >
                    Amount ({activeCurrency})
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-tabular text-base font-medium text-[#78716C]">
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
                      className={`h-12 w-full rounded-md border border-[#E7E5E0] bg-white ${
                        activeCurrency === 'MMK' ? 'pl-10' : 'pl-8'
                      } pr-4 font-mono-tabular text-lg font-semibold text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="expense-title"
                    className="block text-xs font-medium text-[#57534E]"
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
                    className="mt-1.5 h-10 w-full rounded-md border border-[#E7E5E0] bg-white px-3.5 text-sm text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expense-category"
                      className="block text-xs font-medium text-[#57534E]"
                    >
                      Category
                    </label>
                    <select
                      id="expense-category"
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as ExpenseCategory)
                      }
                      className="mt-1.5 h-10 w-full rounded-md border border-[#E7E5E0] bg-white px-3 text-sm text-[#18181B] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
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
                      className="block text-xs font-medium text-[#57534E]"
                    >
                      Date
                    </label>
                    <input
                      id="expense-date"
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-md border border-[#E7E5E0] bg-white px-3 font-mono-tabular text-sm text-[#18181B] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#57534E]">
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
                            ? 'border-[#166534] bg-[#F0FDF4] text-[#166534]'
                            : 'border-[#E7E5E0] bg-white text-[#57534E] hover:text-[#18181B]'
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
                    className="block text-xs font-medium text-[#57534E]"
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
                    className="mt-1.5 w-full rounded-md border border-[#E7E5E0] bg-white px-3.5 py-2.5 text-sm text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#E7E5E0] pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="h-10 rounded-md border border-[#E7E5E0] bg-white px-4 text-sm font-medium text-[#18181B] hover:bg-[#F4F2ED] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 rounded-md bg-[#166534] px-5 text-sm font-medium text-white hover:bg-[#14532D] disabled:opacity-60 transition-colors"
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
