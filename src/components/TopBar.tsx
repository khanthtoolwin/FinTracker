import { ChevronLeft, ChevronRight, Menu, Plus } from 'lucide-react';
import { getMonthLabel } from '../lib/analytics';
import type { NavSection } from '../types/expense';

interface TopBarProps {
  activeSection: NavSection;
  activeMonth: string;
  onChangeMonth: (delta: number) => void;
  onOpenMobileMenu: () => void;
  onOpenAddExpense: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  overview: 'Notebook Overview',
  ledger: 'Daily Expenses',
  analytics: 'Monthly Analytics',
  setup: 'Setup & Export',
};

export function TopBar({
  activeSection,
  activeMonth,
  onChangeMonth,
  onOpenMobileMenu,
  onOpenAddExpense,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#222A32] bg-[#0B0E11]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-8 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#222A32] bg-[#13181D] text-[#F1F5F9] hover:bg-[#1A2129] transition-colors shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#F1F5F9] truncate">
            {SECTION_TITLES[activeSection]}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            aria-label="Active month selector"
            className="hidden sm:flex items-center rounded-md border border-[#222A32] bg-[#13181D]"
          >
            <button
              type="button"
              onClick={() => onChangeMonth(-1)}
              aria-label="Previous month"
              className="inline-flex h-9 w-9 items-center justify-center text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9] transition-colors rounded-l-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-medium text-[#F1F5F9] whitespace-nowrap min-w-[128px] text-center">
              {getMonthLabel(activeMonth)}
            </span>
            <button
              type="button"
              onClick={() => onChangeMonth(1)}
              aria-label="Next month"
              className="inline-flex h-9 w-9 items-center justify-center text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9] transition-colors rounded-r-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#10B981] px-4 text-sm font-semibold text-[#042F21] hover:bg-[#34D399] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E11]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      <div className="sm:hidden border-t border-[#222A32] px-4 py-2 flex items-center justify-between bg-[#13181D]">
        <button
          type="button"
          onClick={() => onChangeMonth(-1)}
          aria-label="Previous month"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-[#F1F5F9]">
          {getMonthLabel(activeMonth)}
        </span>
        <button
          type="button"
          onClick={() => onChangeMonth(1)}
          aria-label="Next month"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
