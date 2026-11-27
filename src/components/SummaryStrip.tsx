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
      ? 'text-[#7C8896]'
      : summary.monthDeltaPercent > 10
        ? 'text-[#FBBF24]'
        : summary.monthDeltaPercent < 0
          ? 'text-[#34D399]'
          : 'text-[#94A3B8]';

  return (
    <section
      aria-label="Monthly spending summary"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border border-[#222A32] bg-[#13181D] rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-[#222A32]"
    >
      <div className="p-5">
        <p className="text-xs font-medium text-[#94A3B8]">Total Spent</p>
        <p className="mt-2 font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-[#F1F5F9] tabular-nums">
          {formatCurrency(summary.totalSpent, activeCurrency)}
        </p>
        <p className={`mt-1.5 text-xs font-medium ${deltaTone}`}>{deltaText}</p>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium text-[#94A3B8]">Daily Average</p>
        <p className="mt-2 font-mono-tabular text-2xl font-semibold tracking-tight text-[#F1F5F9]">
          {formatCurrency(summary.dailyAverage, activeCurrency)}
        </p>
        <p className="mt-1.5 text-xs text-[#7C8896]">{getMonthLabel(activeMonth)}</p>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium text-[#94A3B8]">Entries Logged</p>
        <p className="mt-2 font-mono-tabular text-2xl font-semibold tracking-tight text-[#F1F5F9]">
          {summary.transactionCount}
        </p>
        <p className="mt-1.5 text-xs text-[#7C8896]">
          {isFiltered
            ? `Showing ${filteredCount} matching filter`
            : summary.transactionCount === 1
              ? '1 recorded entry'
              : `${summary.transactionCount} recorded entries`}
        </p>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium text-[#94A3B8]">Top Category</p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-[#F1F5F9] truncate">
          {summary.topCategory ?? 'None yet'}
        </p>
        <p className="mt-2.5 text-xs font-mono-tabular text-[#7C8896]">
          {summary.topCategory
            ? `${formatCurrency(summary.topCategoryAmount, activeCurrency)} this month`
            : 'Log an expense to compare'}
        </p>
      </div>
    </section>
  );
}
