import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  Plus,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/finance/StatCard';
import { TransactionCard } from '@/components/finance/TransactionCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFinance } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';
import { isFixedExpenseCategory } from '@/utils/calculations';
import { formatINR } from '@/utils/currency';
import {
  formatMonthYear,
  getTodayIST,
  getWeekBoundsIST,
} from '@/utils/date';

export function ExpensesPage() {
  const {
    transactions,
    monthTransactions,
    categories,
    selectedMonthYear,
    summary,
    hideBalances,
    openQuickAdd,
  } = useFinance();

  const [groupTab, setGroupTab] = useState<'all' | 'fixed' | 'variable'>('all');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const todayIST = getTodayIST();
  const weekBounds = useMemo(() => getWeekBoundsIST(todayIST), [todayIST]);

  const periodTotals = useMemo(() => {
    let todayTotal = 0;
    let weekTotal = 0;

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      if (tx.date === todayIST) todayTotal += tx.amountPaise;
      if (tx.date >= weekBounds.start && tx.date <= weekBounds.end) {
        weekTotal += tx.amountPaise;
      }
    }
    return { todayTotal, weekTotal };
  }, [transactions, todayIST, weekBounds]);

  const monthExpenses = useMemo(
    () => monthTransactions.filter((tx) => tx.type === 'expense'),
    [monthTransactions],
  );

  const fixedExpenses = useMemo(
    () =>
      monthExpenses.filter((tx) =>
        isFixedExpenseCategory(tx.categoryId, categoryMap),
      ),
    [monthExpenses, categoryMap],
  );

  const variableExpenses = useMemo(
    () =>
      monthExpenses.filter(
        (tx) => !isFixedExpenseCategory(tx.categoryId, categoryMap),
      ),
    [monthExpenses, categoryMap],
  );

  const visibleExpenses =
    groupTab === 'fixed'
      ? fixedExpenses
      : groupTab === 'variable'
        ? variableExpenses
        : monthExpenses;

  const monthLabel = formatMonthYear(
    selectedMonthYear.year,
    selectedMonthYear.month,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Outflows • {monthLabel}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Fixed & Personal Expenses
          </h2>
        </div>

        <Button
          onClick={() => openQuickAdd({ type: 'expense', categoryId: 'petrol' })}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Expense
        </Button>
      </div>

      {/* Daily, Weekly & Monthly Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Spending"
          value={formatINR(periodTotals.todayTotal, { hideValue: hideBalances })}
          icon={<Calendar className="h-4 w-4" />}
          subtitle="Asia/Kolkata date boundary"
        />
        <StatCard
          label="This Week"
          value={formatINR(periodTotals.weekTotal, { hideValue: hideBalances })}
          icon={<ArrowUpRight className="h-4 w-4" />}
          subtitle={`${weekBounds.start} to ${weekBounds.end}`}
        />
        <StatCard
          label="Monthly Fixed Paid"
          value={formatINR(summary.fixedExpensesPaise, {
            hideValue: hideBalances,
          })}
          icon={<ShieldCheck className="h-4 w-4" />}
          subtitle="AC EMI, Parents, Dad, Madrasa"
        />
        <StatCard
          label="Monthly Personal"
          value={formatINR(summary.variableExpensesPaise, {
            hideValue: hideBalances,
          })}
          icon={<Wallet className="h-4 w-4" />}
          subtitle="Petrol, Food, Games, Recharge & more"
          emphasized
        />
      </div>

      {/* Segmented Switcher: All / Fixed / Personal */}
      <div className="inline-flex rounded-full border border-border bg-surface-secondary p-1">
        {(
          [
            { key: 'all', label: `All (${monthExpenses.length})` },
            { key: 'fixed', label: `Fixed (${fixedExpenses.length})` },
            { key: 'variable', label: `Personal (${variableExpenses.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setGroupTab(tab.key)}
            className={cn(
              'min-h-[40px] rounded-full px-4 text-xs sm:text-sm font-semibold transition-all',
              groupTab === tab.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Category Entry Bar */}
      <div className="rounded-[24px] border border-border bg-surface p-4 sm:p-5 shadow-card dark:shadow-card-dark space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Quick Daily Entry
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'petrol', label: 'Petrol' },
            { id: 'food', label: 'Food' },
            { id: 'games', label: 'Games' },
            { id: 'mobile_recharge', label: 'Mobile Recharge' },
            { id: 'shopping', label: 'Shopping' },
            { id: 'medical', label: 'Medical' },
          ].map((quick) => (
            <Button
              key={quick.id}
              size="sm"
              variant="outline"
              onClick={() =>
                openQuickAdd({ type: 'expense', categoryId: quick.id })
              }
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              {quick.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Expense List */}
      {visibleExpenses.length === 0 ? (
        <EmptyState
          title="No expenses in this view"
          description={`Record an expense for ${monthLabel} using Quick Daily Entry above.`}
          action={
            <Button onClick={() => openQuickAdd({ type: 'expense' })}>
              Add Expense
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {visibleExpenses.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              category={categoryMap.get(tx.categoryId)}
              hideBalances={hideBalances}
              showDate
              onEdit={(item) => openQuickAdd({ editingTransaction: item })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
