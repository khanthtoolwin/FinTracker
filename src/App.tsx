/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'motion/react';
import { AuthGate } from './components/AuthGate';
import { ExpenseDrawer } from './components/ExpenseDrawer';
import { ExpenseLedger } from './components/ExpenseLedger';
import { FilterToolbar } from './components/FilterToolbar';
import { SetupAndExportView } from './components/SetupAndExportView';
import { Sidebar } from './components/Sidebar';
import { SpendingCharts } from './components/SpendingCharts';
import { SummaryStrip } from './components/SummaryStrip';
import { TopBar } from './components/TopBar';
import {
  buildCategoryBreakdown,
  buildDailySpendingSeries,
  computeMonthlySummary,
  filterExpenses,
  getCurrentMonthKey,
  getDefaultFilters,
  shiftMonthKey,
} from './lib/analytics';
import { downloadExpensesCsv } from './lib/csv';
import {
  CURRENCY_CONFIG,
  normalizeCurrency,
  readStoredCurrency,
  writeStoredCurrency,
} from './lib/currency';
import {
  clearLocalExpenses,
  createExpense,
  deleteExpense,
  fetchExpenses,
  updateExpense,
} from './lib/expenseStore';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  CurrencyCode,
  Expense,
  ExpenseInput,
  FilterState,
  NavSection,
} from './types/expense';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(isSupabaseConfigured);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const [authUrlError, setAuthUrlError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState<string>(getCurrentMonthKey);
  const [activeCurrency, setActiveCurrency] =
    useState<CurrencyCode>(readStoredCurrency);
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthChecking(false);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const urlErrorDesc =
      searchParams.get('error_description') ||
      hashParams.get('error_description');
    if (urlErrorDesc) {
      setAuthUrlError(urlErrorDesc);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (hashParams.get('type') === 'recovery') {
      setIsPasswordRecovery(true);
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session ?? null);
        setAuthChecking(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      setSession(nextSession ?? null);
      setAuthChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    const rawMetaCurrency = session?.user?.user_metadata?.currency;
    if (typeof rawMetaCurrency === 'string') {
      const normalized = normalizeCurrency(rawMetaCurrency);
      if (normalized === rawMetaCurrency) {
        setActiveCurrency(normalized);
        writeStoredCurrency(normalized);
      }
    }
  }, [session?.user?.user_metadata?.currency]);

  const loadWorkspaceExpenses = useCallback(async () => {
    if (isSupabaseConfigured && !userId) {
      setExpenses([]);
      setLoadingExpenses(false);
      return;
    }

    setLoadingExpenses(true);
    setLoadError(null);
    try {
      const rows = await fetchExpenses(userId);
      setExpenses(rows);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Unable to load expenses. Please try again.'
      );
    } finally {
      setLoadingExpenses(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authChecking) {
      loadWorkspaceExpenses();
    }
  }, [authChecking, loadWorkspaceExpenses]);

  const monthExpenses = useMemo(
    () => expenses.filter((item) => item.expenseDate.startsWith(activeMonth)),
    [expenses, activeMonth]
  );

  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, activeMonth, filters, activeCurrency),
    [expenses, activeMonth, filters, activeCurrency]
  );

  const summary = useMemo(
    () => computeMonthlySummary(expenses, activeMonth, activeCurrency),
    [expenses, activeMonth, activeCurrency]
  );

  const dailySeries = useMemo(
    () => buildDailySpendingSeries(monthExpenses, activeMonth, activeCurrency),
    [monthExpenses, activeMonth, activeCurrency]
  );

  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(monthExpenses, activeCurrency),
    [monthExpenses, activeCurrency]
  );

  const isFiltered = useMemo(
    () =>
      filters.search.trim().length > 0 ||
      filters.category !== 'All' ||
      filters.datePreset !== 'all_month' ||
      filters.sortBy !== 'date_desc',
    [filters]
  );

  async function handleSaveExpense(
    input: ExpenseInput,
    editingId: string | null
  ) {
    if (editingId) {
      const updated = await updateExpense(editingId, input, userId);
      setExpenses((prev) =>
        prev.map((item) => (item.id === editingId ? updated : item))
      );
      setActiveMonth(updated.expenseDate.slice(0, 7));
      showToast('Updated notebook entry');
    } else {
      const created = await createExpense(input, userId);
      setExpenses((prev) => [created, ...prev]);
      setActiveMonth(created.expenseDate.slice(0, 7));
      showToast('Saved expense to ledger');
    }
  }

  async function handleDeleteExpense(id: string) {
    await deleteExpense(id, userId);
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    showToast('Removed entry from ledger');
  }

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
      setExpenses([]);
      setActiveSection('overview');
    }
  }

  function handleExportFilteredCsv() {
    if (filteredExpenses.length === 0) {
      return;
    }
    const suffix =
      filters.datePreset === 'all_month' ? activeMonth : 'filtered';
    downloadExpensesCsv(
      filteredExpenses,
      `fintracker-expenses-${suffix}.csv`,
      activeCurrency
    );
    showToast(`Exported ${filteredExpenses.length} entries to CSV`);
  }

  async function handleChangeCurrency(nextCurrency: CurrencyCode) {
    if (nextCurrency === activeCurrency) {
      return;
    }
    setActiveCurrency(nextCurrency);
    writeStoredCurrency(nextCurrency);
    const meta = CURRENCY_CONFIG[nextCurrency];
    showToast(`Display currency set to ${meta.name} (${meta.symbol})`);

    if (isSupabaseConfigured && supabase && session) {
      try {
        await supabase.auth.updateUser({
          data: { currency: nextCurrency },
        });
      } catch {
        // Keep local preference active if account metadata sync fails
      }
    }
  }

  function handleClearLocalData() {
    clearLocalExpenses();
    setExpenses([]);
    showToast('Cleared local browser ledger');
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-sm text-[#57534E]">Opening FinTracker notebook...</p>
      </div>
    );
  }

  if (isSupabaseConfigured && (!session || isPasswordRecovery)) {
    return (
      <AuthGate
        recoveryMode={isPasswordRecovery}
        initialError={authUrlError}
        onRecoveryComplete={() => {
          setIsPasswordRecovery(false);
          setAuthUrlError(null);
          window.history.replaceState({}, document.title, window.location.pathname);
          showToast('Password updated successfully');
        }}
        onCancelRecovery={async () => {
          if (supabase) {
            await supabase.auth.signOut();
          }
          setIsPasswordRecovery(false);
          setAuthUrlError(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isSupabaseConfigured={isSupabaseConfigured}
        userEmail={session?.user?.email ?? null}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          activeMonth={activeMonth}
          onChangeMonth={(delta) =>
            setActiveMonth((prev) => shiftMonthKey(prev, delta))
          }
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAddExpense={() => {
            setEditingExpense(null);
            setDrawerOpen(true);
          }}
        />

        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-8 py-6 sm:py-8">
          {loadError && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs text-[#DC2626]"
            >
              <span className="font-medium">{loadError}</span>
              <button
                type="button"
                onClick={loadWorkspaceExpenses}
                className="font-semibold underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {activeSection === 'overview' && (
                <>
                  <SummaryStrip
                    summary={summary}
                    activeMonth={activeMonth}
                    activeCurrency={activeCurrency}
                    filteredCount={filteredExpenses.length}
                    isFiltered={isFiltered}
                  />

                  <SpendingCharts
                    dailySeries={dailySeries}
                    categoryBreakdown={categoryBreakdown}
                    activeMonth={activeMonth}
                    activeCurrency={activeCurrency}
                    hasAnyExpensesInMonth={monthExpenses.length > 0}
                    onLogFirstExpense={() => {
                      setEditingExpense(null);
                      setDrawerOpen(true);
                    }}
                  />

                  <FilterToolbar
                    filters={filters}
                    onChangeFilters={setFilters}
                    onResetFilters={() => setFilters(getDefaultFilters())}
                    onExportCsv={handleExportFilteredCsv}
                    filteredCount={filteredExpenses.length}
                    isFiltered={isFiltered}
                  />

                  <ExpenseLedger
                    expenses={filteredExpenses.slice(0, 12)}
                    loading={loadingExpenses}
                    activeMonth={activeMonth}
                    activeCurrency={activeCurrency}
                    isFiltered={isFiltered}
                    hasAnyExpensesInWorkspace={expenses.length > 0}
                    onEdit={(expense) => {
                      setEditingExpense(expense);
                      setDrawerOpen(true);
                    }}
                    onDelete={handleDeleteExpense}
                    onResetFilters={() => setFilters(getDefaultFilters())}
                    onLogFirstExpense={() => {
                      setEditingExpense(null);
                      setDrawerOpen(true);
                    }}
                    compactHeader={filteredExpenses.length > 12}
                    onViewFullLedger={() => setActiveSection('ledger')}
                  />
                </>
              )}

              {activeSection === 'ledger' && (
                <>
                  <SummaryStrip
                    summary={summary}
                    activeMonth={activeMonth}
                    activeCurrency={activeCurrency}
                    filteredCount={filteredExpenses.length}
                    isFiltered={isFiltered}
                  />

                  <FilterToolbar
                    filters={filters}
                    onChangeFilters={setFilters}
                    onResetFilters={() => setFilters(getDefaultFilters())}
                    onExportCsv={handleExportFilteredCsv}
                    filteredCount={filteredExpenses.length}
                    isFiltered={isFiltered}
                  />

                  <ExpenseLedger
                    expenses={filteredExpenses}
                    loading={loadingExpenses}
                    activeMonth={activeMonth}
                    activeCurrency={activeCurrency}
                    isFiltered={isFiltered}
                    hasAnyExpensesInWorkspace={expenses.length > 0}
                    onEdit={(expense) => {
                      setEditingExpense(expense);
                      setDrawerOpen(true);
                    }}
                    onDelete={handleDeleteExpense}
                    onResetFilters={() => setFilters(getDefaultFilters())}
                    onLogFirstExpense={() => {
                      setEditingExpense(null);
                      setDrawerOpen(true);
                    }}
                  />
                </>
              )}

              {activeSection === 'analytics' && (
                <>
                  <SummaryStrip
                    summary={summary}
                    activeMonth={activeMonth}
                    activeCurrency={activeCurrency}
                    filteredCount={filteredExpenses.length}
                    isFiltered={isFiltered}
                  />

                  <SpendingCharts
                    dailySeries={dailySeries}
                    categoryBreakdown={categoryBreakdown}
                    activeMonth={activeMonth}
                    activeCurrency={activeCurrency}
                    hasAnyExpensesInMonth={monthExpenses.length > 0}
                    onLogFirstExpense={() => {
                      setEditingExpense(null);
                      setDrawerOpen(true);
                    }}
                    expanded
                  />
                </>
              )}

              {activeSection === 'setup' && (
                <SetupAndExportView
                  expenses={expenses}
                  activeCurrency={activeCurrency}
                  onChangeCurrency={handleChangeCurrency}
                  isSupabaseConfigured={isSupabaseConfigured}
                  userEmail={session?.user?.email ?? null}
                  onClearLocalData={handleClearLocalData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ExpenseDrawer
        open={drawerOpen}
        editingExpense={editingExpense}
        activeCurrency={activeCurrency}
        onClose={() => {
          setDrawerOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 right-5 z-50 rounded-md border border-[#E7E5E0] bg-[#18181B] px-4 py-2.5 text-xs font-medium text-white shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
