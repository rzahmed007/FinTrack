import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  HeartHandshake,
  TrendingUp,
} from 'lucide-react';
import { ChartCard } from '@/components/charts/ChartCard';
import {
  CategoryBreakdownChart,
  IncomeVsExpenseBarChart,
  SpendingTrendChart,
} from '@/components/charts/MonochromeCharts';
import { StatCard } from '@/components/finance/StatCard';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { exportTransactionsToCSV } from '@/services/financeService';
import {
  calculateExpenseBreakdown,
  isFixedExpenseCategory,
} from '@/utils/calculations';
import { formatINR } from '@/utils/currency';
import {
  getMonthDateBounds,
  getTodayIST,
  getWeekBoundsIST,
} from '@/utils/date';

type ReportGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export function ReportsPage() {
  const {
    transactions,
    categories,
    selectedMonthYear,
    yearlySummary,
    dailySpendingSeries,
    hideBalances,
  } = useFinance();
  const { showToast } = useToast();

  const todayIST = getTodayIST();
  const [granularity, setGranularity] = useState<ReportGranularity>('monthly');
  const [customStart, setCustomStart] = useState(
    getMonthDateBounds(selectedMonthYear.year, selectedMonthYear.month).start,
  );
  const [customEnd, setCustomEnd] = useState(todayIST);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const dateRange = useMemo(() => {
    if (granularity === 'daily') {
      return { start: todayIST, end: todayIST, label: `Today (${todayIST})` };
    }
    if (granularity === 'weekly') {
      const wb = getWeekBoundsIST(todayIST);
      return { start: wb.start, end: wb.end, label: `${wb.start} to ${wb.end}` };
    }
    if (granularity === 'monthly') {
      const mb = getMonthDateBounds(
        selectedMonthYear.year,
        selectedMonthYear.month,
      );
      return {
        start: mb.start,
        end: mb.end,
        label: `${selectedMonthYear.year}-${String(selectedMonthYear.month).padStart(2, '0')}`,
      };
    }
    if (granularity === 'yearly') {
      return {
        start: `${selectedMonthYear.year}-01-01`,
        end: `${selectedMonthYear.year}-12-31`,
        label: `Year ${selectedMonthYear.year}`,
      };
    }
    return {
      start: customStart || '1970-01-01',
      end: customEnd || '2999-12-31',
      label: `${customStart || '...'} to ${customEnd || '...'}`,
    };
  }, [granularity, todayIST, selectedMonthYear, customStart, customEnd]);

  const periodTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.date >= dateRange.start && tx.date <= dateRange.end,
      ),
    [transactions, dateRange],
  );

  const periodMetrics = useMemo(() => {
    let income = 0;
    let parentSupport = 0;
    let fixed = 0;
    let variable = 0;

    for (const tx of periodTransactions) {
      if (tx.type === 'income') {
        income += tx.amountPaise;
        if (tx.categoryId === 'parent_support') {
          parentSupport += tx.amountPaise;
        }
      } else {
        if (isFixedExpenseCategory(tx.categoryId, categoryMap)) {
          fixed += tx.amountPaise;
        } else {
          variable += tx.amountPaise;
        }
      }
    }

    return {
      income,
      parentSupport,
      fixed,
      variable,
      expenses: fixed + variable,
      cashFlow: income - (fixed + variable),
    };
  }, [periodTransactions, categoryMap]);

  const periodBreakdown = useMemo(
    () => calculateExpenseBreakdown(periodTransactions, categories),
    [periodTransactions, categories],
  );

  const handleExportCSV = () => {
    const names = new Map(categories.map((c) => [c.id, c.name]));
    const csv = exportTransactionsToCSV(periodTransactions, names);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fintrack-report-${granularity}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast({
      variant: 'success',
      title: 'CSV report exported',
      description: `${periodTransactions.length} transaction(s) downloaded.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Financial Analytics • {dateRange.label}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Reports & Cash Flow
          </h2>
        </div>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export CSV
        </Button>
      </div>

      {/* Period Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap rounded-full border border-border bg-surface-secondary p-1">
          {(
            [
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' },
              { id: 'custom', label: 'Custom Range' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGranularity(item.id)}
              className={cn(
                'min-h-[40px] rounded-full px-4 text-xs sm:text-sm font-semibold transition-all',
                granularity === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {granularity === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[24px] border border-border bg-surface p-4">
          <DatePicker
            label="Start Date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <DatePicker
            label="End Date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
        </div>
      )}

      {/* Report KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Period Income"
          value={formatINR(periodMetrics.income, { hideValue: hideBalances })}
          icon={<ArrowDownLeft className="h-4 w-4" />}
          subtitle={`Includes ${formatINR(periodMetrics.parentSupport, {
            hideValue: hideBalances,
          })} parent support`}
        />
        <StatCard
          label="Period Expenses"
          value={formatINR(periodMetrics.expenses, { hideValue: hideBalances })}
          icon={<ArrowUpRight className="h-4 w-4" />}
          subtitle={`Fixed ${formatINR(periodMetrics.fixed, {
            hideValue: hideBalances,
          })} • Personal ${formatINR(periodMetrics.variable, {
            hideValue: hideBalances,
          })}`}
        />
        <StatCard
          label="Net Cash Flow"
          value={formatINR(periodMetrics.cashFlow, {
            showSign: true,
            hideValue: hideBalances,
          })}
          icon={<TrendingUp className="h-4 w-4" />}
          emphasized
          subtitle="Income minus actual expenses"
        />
        <StatCard
          label="Parent Support Received"
          value={formatINR(periodMetrics.parentSupport, {
            hideValue: hideBalances,
          })}
          icon={<HeartHandshake className="h-4 w-4" />}
          subtitle={`Yearly total: ${formatINR(
            yearlySummary.totalParentSupportPaise,
            { hideValue: hideBalances },
          )}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={`Yearly Income vs Expenses (${selectedMonthYear.year})`}
          subtitle={`Annual Income: ${formatINR(
            yearlySummary.totalIncomePaise,
            { hideValue: hideBalances },
          )} • Annual Expenses: ${formatINR(yearlySummary.totalExpensesPaise, {
            hideValue: hideBalances,
          })}`}
        >
          <IncomeVsExpenseBarChart
            months={yearlySummary.months}
            hideBalances={hideBalances}
          />
        </ChartCard>

        <ChartCard
          title="Category Breakdown"
          subtitle={`Expenses within ${dateRange.label}`}
        >
          {periodBreakdown.length === 0 ? (
            <EmptyState
              title="No expenses in range"
              description="Adjust the reporting range to view category shares."
            />
          ) : (
            <CategoryBreakdownChart
              items={periodBreakdown}
              hideBalances={hideBalances}
            />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Daily Spending Trend (Selected Month)"
        subtitle="Calculated directly from the central transaction ledger"
      >
        <SpendingTrendChart
          data={dailySpendingSeries}
          hideBalances={hideBalances}
        />
      </ChartCard>
    </div>
  );
}
