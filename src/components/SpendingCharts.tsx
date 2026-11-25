import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CategoryBreakdownItem,
  DailySeriesPoint,
  formatCompactCurrency,
  formatCurrency,
  formatLedgerDate,
  getMonthLabel,
} from '../lib/analytics';
import { CurrencyCode } from '../types/expense';

interface SpendingChartsProps {
  dailySeries: DailySeriesPoint[];
  categoryBreakdown: CategoryBreakdownItem[];
  activeMonth: string;
  activeCurrency: CurrencyCode;
  hasAnyExpensesInMonth: boolean;
  onLogFirstExpense: () => void;
  expanded?: boolean;
}

interface CustomTooltipPayloadItem {
  value?: number;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  activeCurrency: CurrencyCode;
}

function DailyTooltip({ active, payload, activeCurrency }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const point = payload[0]?.payload as DailySeriesPoint | undefined;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-md border border-[#E7E5E0] bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-[#57534E]">
        {formatLedgerDate(point.date)}
      </p>
      <p className="mt-0.5 font-mono-tabular text-sm font-semibold text-[#18181B]">
        {formatCurrency(point.amount, activeCurrency)}
      </p>
      <p className="text-[11px] text-[#78716C]">
        {point.count} {point.count === 1 ? 'entry' : 'entries'}
      </p>
    </div>
  );
}

function CategoryTooltip({ active, payload, activeCurrency }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const item = payload[0]?.payload as CategoryBreakdownItem | undefined;
  if (!item) {
    return null;
  }

  return (
    <div className="rounded-md border border-[#E7E5E0] bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-[#18181B]">{item.category}</p>
      <p className="mt-0.5 font-mono-tabular text-sm font-semibold text-[#18181B]">
        {formatCurrency(item.amount, activeCurrency)}
      </p>
      <p className="text-[11px] text-[#78716C]">
        {item.share.toFixed(1)}% · {item.count}{' '}
        {item.count === 1 ? 'entry' : 'entries'}
      </p>
    </div>
  );
}

export function SpendingCharts({
  dailySeries,
  categoryBreakdown,
  activeMonth,
  activeCurrency,
  hasAnyExpensesInMonth,
  onLogFirstExpense,
  expanded = false,
}: SpendingChartsProps) {
  const [chartMode, setChartMode] = useState<'bars' | 'trend'>('bars');
  const chartHeight = expanded ? 320 : 250;

  return (
    <section
      aria-label="Monthly spending visualizations"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      <div className="lg:col-span-7 border border-[#E7E5E0] bg-white rounded-lg p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#18181B]">
              Daily Spending Rhythm
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              Day-by-day totals across {getMonthLabel(activeMonth)}
            </p>
          </div>

          <div
            role="group"
            aria-label="Chart view style"
            className="inline-flex items-center rounded-md border border-[#E7E5E0] bg-[#FAF9F6] p-0.5"
          >
            <button
              type="button"
              onClick={() => setChartMode('bars')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                chartMode === 'bars'
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              Daily Bars
            </button>
            <button
              type="button"
              onClick={() => setChartMode('trend')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                chartMode === 'trend'
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              Trend Line
            </button>
          </div>
        </div>

        {!hasAnyExpensesInMonth ? (
          <div
            style={{ height: chartHeight }}
            className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#E7E5E0] bg-[#FAF9F6]/60 px-6 text-center"
          >
            <p className="text-sm font-medium text-[#18181B]">
              No spending recorded for {getMonthLabel(activeMonth)}
            </p>
            <p className="mt-1 text-xs text-[#57534E] max-w-xs">
              Add your first daily expense to plot your spending cadence across the month.
            </p>
            <button
              type="button"
              onClick={onLogFirstExpense}
              className="mt-4 inline-flex items-center px-3.5 py-2 text-xs font-medium text-white bg-[#166534] rounded-md hover:bg-[#14532D] transition-colors"
            >
              Log First Expense
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'bars' ? (
                <BarChart
                  data={dailySeries}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#E7E5E0"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: '#E7E5E0' }}
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    interval={2}
                  />
                  <YAxis
                    width={activeCurrency === 'MMK' ? 76 : 58}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    tickFormatter={(val: number) =>
                      formatCompactCurrency(val, activeCurrency)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(22, 101, 52, 0.06)' }}
                    content={<DailyTooltip activeCurrency={activeCurrency} />}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#166534"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={dailySeries}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="forestInkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#166534" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="#E7E5E0"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: '#E7E5E0' }}
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    interval={2}
                  />
                  <YAxis
                    width={activeCurrency === 'MMK' ? 76 : 58}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    tickFormatter={(val: number) =>
                      formatCompactCurrency(val, activeCurrency)
                    }
                  />
                  <Tooltip
                    content={<DailyTooltip activeCurrency={activeCurrency} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#166534"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#forestInkFill)"
                    activeDot={{ r: 4, fill: '#166534', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="lg:col-span-5 border border-[#E7E5E0] bg-white rounded-lg p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-display text-lg font-semibold text-[#18181B]">
            Category Breakdown
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Where your spending went in {getMonthLabel(activeMonth)}
          </p>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div
            style={{ height: chartHeight }}
            className="flex items-center justify-center rounded-md border border-dashed border-[#E7E5E0] bg-[#FAF9F6]/60 px-6 text-center"
          >
            <p className="text-xs text-[#57534E]">
              Categories will rank automatically once entries are logged.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div style={{ width: '100%', height: Math.max(150, Math.min(chartHeight - 40, categoryBreakdown.length * 36 + 20)) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBreakdown}
                  layout="vertical"
                  margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="#E7E5E0"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    hide
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={116}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#18181B', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(24, 24, 27, 0.03)' }}
                    content={<CategoryTooltip activeCurrency={activeCurrency} />}
                  />
                  <Bar dataKey="amount" radius={[0, 3, 3, 0]} barSize={16}>
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-[#E7E5E0] pt-3 space-y-2">
              {categoryBreakdown.slice(0, expanded ? 8 : 4).map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#18181B] font-medium truncate">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono-tabular">
                    <span className="text-[#78716C]">{item.share.toFixed(0)}%</span>
                    <span className="font-medium text-[#18181B]">
                      {formatCurrency(item.amount, activeCurrency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
