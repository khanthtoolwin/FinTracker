import { Download, Search, X } from 'lucide-react';
import {
  DateRangePreset,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  FilterState,
  SortOption,
} from '../types/expense';

interface FilterToolbarProps {
  filters: FilterState;
  onChangeFilters: (next: FilterState) => void;
  onResetFilters: () => void;
  onExportCsv: () => void;
  filteredCount: number;
  isFiltered: boolean;
}

export function FilterToolbar({
  filters,
  onChangeFilters,
  onResetFilters,
  onExportCsv,
  filteredCount,
  isFiltered,
}: FilterToolbarProps) {
  return (
    <div className="border border-[#E7E5E0] bg-white rounded-lg p-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              onChangeFilters({ ...filters, search: e.target.value })
            }
            placeholder="Search description, category, payment, or notes..."
            aria-label="Search expenses"
            className="h-10 w-full rounded-md border border-[#E7E5E0] bg-[#FAF9F6] pl-9 pr-9 text-sm text-[#18181B] placeholder:text-[#78716C] focus:border-[#166534] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534]/15 transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, search: '' })}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-[#78716C] hover:text-[#18181B]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by category"
            value={filters.category}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                category: e.target.value as ExpenseCategory | 'All',
              })
            }
            className="h-10 rounded-md border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-xs font-medium text-[#18181B] focus:border-[#166534] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort expenses"
            value={filters.sortBy}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                sortBy: e.target.value as SortOption,
              })
            }
            className="h-10 rounded-md border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-xs font-medium text-[#18181B] focus:border-[#166534] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={filteredCount === 0}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#E7E5E0] bg-white px-3.5 text-xs font-medium text-[#18181B] hover:bg-[#F4F2ED] disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#E7E5E0]/70">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Date window"
            className="inline-flex items-center rounded-md border border-[#E7E5E0] bg-[#FAF9F6] p-0.5"
          >
            {(
              [
                { id: 'all_month', label: 'Selected Month' },
                { id: 'last_7', label: 'Last 7 Days' },
                { id: 'custom', label: 'Custom Range' },
              ] as Array<{ id: DateRangePreset; label: string }>
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onChangeFilters({ ...filters, datePreset: preset.id })
                }
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  filters.datePreset === preset.id
                    ? 'bg-white text-[#18181B] shadow-xs'
                    : 'text-[#57534E] hover:text-[#18181B]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {filters.datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                aria-label="Start date"
                value={filters.customStart}
                onChange={(e) =>
                  onChangeFilters({ ...filters, customStart: e.target.value })
                }
                className="h-8 rounded-md border border-[#E7E5E0] bg-white px-2.5 text-xs font-mono-tabular text-[#18181B] focus:border-[#166534] focus:outline-none"
              />
              <span className="text-xs text-[#78716C]">to</span>
              <input
                type="date"
                aria-label="End date"
                value={filters.customEnd}
                onChange={(e) =>
                  onChangeFilters({ ...filters, customEnd: e.target.value })
                }
                className="h-8 rounded-md border border-[#E7E5E0] bg-white px-2.5 text-xs font-mono-tabular text-[#18181B] focus:border-[#166534] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#57534E]">
          <span className="font-mono-tabular">
            {filteredCount} {filteredCount === 1 ? 'entry' : 'entries'}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="font-medium text-[#166534] hover:underline whitespace-nowrap"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
