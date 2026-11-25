import { formatCurrency, getMonthLabel, MonthlySummary } from '../lib/analytics';
import { CurrencyCode } from '../types/expense';

interface SummaryStripProps {
  summary: MonthlySummary;
  activeMonth: string;
  activeCurrency: CurrencyCode;
  filteredCount: number;
  isFiltered: boolean;
}

export function SummaryStrip({
  summary,
  activeMonth,
  activeCurrency,
  filteredCount,
  isFiltered,
}: SummaryStripProps) {
  const deltaText =
    summary.monthDeltaPercent === null
      ? 'No prior month data'
      : `${summary.monthDeltaPercent >= 0 ? '+' : ''}${summary.monthDeltaPercent.toFixed(
          1
        )}% vs previous month`;

  const deltaTone =
    summary.monthDeltaPercent === null
      ? 'text-[#78716C]'
      : summary.monthDeltaPercent > 10
        ? 'text-[#B45309]'
        : summary.monthDeltaPercent < 0
          ? 'text-[#166534]'
          : 'text-[#57534E]';

  return (
    <section
      aria-label="Monthly spending summary"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border border-[#E7E5E0] bg-white rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-[#E7E5E0]"
    >
      <div className="p-5">
        <p className="text-xs font-medium text-[#57534E]">Total Spent</p>
        <p className="mt-2 font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-[#18181B] tabular-nums">
          {formatCurrency(summary.totalSpent, activeCurrency)}
        </p>
        <p className={`mt-1.5 text-xs font-medium ${deltaTone}`}>{deltaText}</p>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium text-[#57534E]">Daily Average</p>
        <p className="mt-2 font-mono-tabular text-2xl font-semibold tracking-tight text-[#18181B]">
          {formatCurrency(summary.dailyAverage, activeCurrency)}
        </p>
        <p className="mt-1.5 text-xs text-[#78716C]">{getMonthLabel(activeMonth)}</p>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium text-[#57534E]">Entries Logged</p>
        <p className="mt-2 font-mono-tabular text-2xl font-semibold tracking-tight text-[#18181B]">
          {summary.transactionCount}
        </p>
        <p className="mt-1.5 text-xs text-[#78716C]">
          {isFiltered
            ? `Showing ${filteredCount} matching filter`
            : summary.transactionCount === 1
              ? '1 recorded entry'
              : `${summary.transactionCount} recorded entries`}
        </p>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium text-[#57534E]">Top Category</p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-[#18181B] truncate">
          {summary.topCategory ?? 'None yet'}
        </p>
        <p className="mt-2.5 text-xs font-mono-tabular text-[#78716C]">
          {summary.topCategory
            ? `${formatCurrency(summary.topCategoryAmount, activeCurrency)} this month`
            : 'Log an expense to compare'}
        </p>
      </div>
    </section>
  );
}
