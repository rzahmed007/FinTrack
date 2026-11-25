import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ChartCard } from '@/components/charts/ChartCard';
import {
  CategoryBreakdownChart,
  SpendingTrendChart,
} from '@/components/charts/MonochromeCharts';
import { BalanceCard } from '@/components/finance/BalanceCard';
import { StatCard } from '@/components/finance/StatCard';
import { TransactionCard } from '@/components/finance/TransactionCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useFinance } from '@/contexts/FinanceContext';
import { formatINR } from '@/utils/currency';
import { formatMonthYear } from '@/utils/date';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    isLoading,
    selectedMonthYear,
    hideBalances,
    toggleHideBalances,
    summary,
    monthTransactions,
    categories,
    budgetConfig,
    expenseBreakdown,
    dailySpendingSeries,
    openQuickAdd,
  } = useFinance();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const monthLabel = formatMonthYear(
    selectedMonthYear.year,
    selectedMonthYear.month,
  );

  const upcomingFixedPayments = useMemo(() => {
    const paidByCategory = new Map<string, number>();
    for (const tx of monthTransactions) {
      if (tx.type === 'expense') {
        paidByCategory.set(
          tx.categoryId,
          (paidByCategory.get(tx.categoryId) ?? 0) + tx.amountPaise,
        );
      }
    }

    return budgetConfig.plannedFixedPayments
      .filter((fp) => fp.active)
      .map((fp) => {
        const paidPaise = paidByCategory.get(fp.categoryId) ?? 0;
        const isPaid = paidPaise >= fp.amountPaise;
        return { ...fp, paidPaise, isPaid };
      });
  }, [budgetConfig.plannedFixedPayments, monthTransactions]);

  const recentTransactions = useMemo(
    () => monthTransactions.slice(0, 6),
    [monthTransactions],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader lines={4} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonLoader lines={2} />
          <SkeletonLoader lines={2} />
          <SkeletonLoader lines={2} />
          <SkeletonLoader lines={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Balance Hero */}
      <BalanceCard
        availableBalancePaise={summary.availableBalancePaise}
        openingBalancePaise={summary.openingBalancePaise}
        netCashFlowPaise={summary.netCashFlowPaise}
        monthLabel={monthLabel}
        hideBalances={hideBalances}
        onToggleHide={toggleHideBalances}
        onAddIncome={() => openQuickAdd({ type: 'income', categoryId: 'salary' })}
        onAddExpense={() => openQuickAdd({ type: 'expense', categoryId: 'food' })}
        onRecordEMI={() => navigate('/emi')}
      />

      {/* Overspending Alert Banner (only when personal budget exceeded) */}
      {summary.isPersonalBudgetOverspent && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[24px] border border-foreground/40 bg-surface p-4 sm:px-6 pattern-stripes">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-foreground mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">
                Personal budget exceeded by{' '}
                <span className="tabular-nums">
                  {formatINR(summary.overspentPaise, {
                    hideValue: hideBalances,
                  })}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Variable spending is{' '}
                <span className="tabular-nums">
                  {formatINR(summary.variableExpensesPaise, {
                    hideValue: hideBalances,
                  })}
                </span>{' '}
                against a planned personal budget of{' '}
                <span className="tabular-nums">
                  {formatINR(summary.plannedPersonalBudgetPaise, {
                    hideValue: hideBalances,
                  })}
                </span>
                .
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/budget')}
            className="bg-surface shrink-0"
          >
            Inspect Budget
          </Button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Income"
          value={formatINR(summary.totalIncomePaise, { hideValue: hideBalances })}
          icon={<ArrowDownLeft className="h-4 w-4" />}
          subtitle={`Salary ${formatINR(summary.salaryPaise, {
            hideValue: hideBalances,
          })} + Support & Other`}
        />
        <StatCard
          label="Salary Received"
          value={formatINR(summary.salaryPaise, { hideValue: hideBalances })}
          icon={<Briefcase className="h-4 w-4" />}
          badge={
            summary.salaryPaise >= summary.plannedSalaryPaise
              ? 'On Plan'
              : 'Pending'
          }
          subtitle={`Planned salary: ${formatINR(summary.plannedSalaryPaise, {
            hideValue: hideBalances,
          })}`}
        />
        <StatCard
          label="Extra from Parents"
          value={formatINR(summary.parentSupportPaise, {
            hideValue: hideBalances,
          })}
          icon={<HeartHandshake className="h-4 w-4" />}
          badge="Separate"
          subtitle="Tracked separately from monthly salary"
        />
        <StatCard
          label="Remaining Personal Budget"
          value={formatINR(summary.remainingPersonalBudgetPaise, {
            hideValue: hideBalances,
          })}
          icon={<Wallet className="h-4 w-4" />}
          emphasized={summary.isPersonalBudgetOverspent}
          badge={
            summary.isPersonalBudgetOverspent
              ? 'Overspent'
              : `${summary.remainingDaysIncludingToday}d left`
          }
          subtitle={
            summary.remainingDaysIncludingToday > 0
              ? `Daily safe allowance: ${formatINR(
                  summary.dailySpendingAllowancePaise,
                  { hideValue: hideBalances },
                )}/day`
              : 'Month completed'
          }
        />
      </div>

      {/* Expense Breakdown Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Expenses"
          value={formatINR(summary.totalExpensesPaise, {
            hideValue: hideBalances,
          })}
          icon={<ArrowUpRight className="h-4 w-4" />}
          subtitle={`${monthTransactions.filter((t) => t.type === 'expense').length} expense transactions this month`}
        />
        <StatCard
          label="Fixed Expenses Paid"
          value={formatINR(summary.fixedExpensesPaise, {
            hideValue: hideBalances,
          })}
          icon={<ShieldCheck className="h-4 w-4" />}
          subtitle={`Planned fixed commitments: ${formatINR(
            summary.plannedFixedPaymentsPaise,
            { hideValue: hideBalances },
          )}`}
        />
        <StatCard
          label="Personal Expenses"
          value={formatINR(summary.variableExpensesPaise, {
            hideValue: hideBalances,
          })}
          icon={<ArrowUpRight className="h-4 w-4" />}
          badge={`${summary.personalBudgetUtilizationPct}% used`}
          subtitle={`Of ${formatINR(summary.plannedPersonalBudgetPaise, {
            hideValue: hideBalances,
          })} planned personal budget`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Spending Trend"
          subtitle={`Daily expenses across ${monthLabel}`}
          rightSlot={
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Full Reports
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <SpendingTrendChart
            data={dailySpendingSeries}
            hideBalances={hideBalances}
          />
        </ChartCard>

        <ChartCard
          title="Category-wise Expense Breakdown"
          subtitle="Share of actual expenses recorded this month"
          rightSlot={
            <Link
              to="/expenses"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              All Expenses
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {expenseBreakdown.length === 0 ? (
            <EmptyState
              title="No expenses recorded"
              description={`Add an expense for ${monthLabel} to view category shares.`}
            />
          ) : (
            <CategoryBreakdownChart
              items={expenseBreakdown}
              hideBalances={hideBalances}
            />
          )}
        </ChartCard>
      </div>

      {/* Upcoming Fixed Payments & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Fixed Payments */}
        <section className="lg:col-span-5 rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Fixed Commitments
              </h2>
              <p className="text-xs text-muted-foreground">
                Planned payments vs actual recorded transactions
              </p>
            </div>
            <Link
              to="/budget"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Configure
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingFixedPayments.map((fp) => (
              <div
                key={fp.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-secondary/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">
                      {fp.label}
                    </span>
                    {fp.isPaid ? (
                      <Badge variant="default">
                        <CheckCircle2 className="h-3 w-3" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="striped">
                        <CalendarClock className="h-3 w-3" />
                        Due {fp.dueDay}th
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    Planned:{' '}
                    {formatINR(fp.amountPaise, { hideValue: hideBalances })}
                  </p>
                </div>

                {!fp.isPaid && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (fp.categoryId === 'ac_emi') {
                        navigate('/emi');
                      } else {
                        openQuickAdd({
                          type: 'expense',
                          categoryId: fp.categoryId,
                        });
                      }
                    }}
                  >
                    Record
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="lg:col-span-7 rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Recent Transactions
              </h2>
              <p className="text-xs text-muted-foreground">
                Latest entries for {monthLabel}
              </p>
            </div>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <EmptyState
              title="No transactions this month"
              description="Tap Add Expense or Add Income to record your first entry."
              action={
                <Button onClick={() => openQuickAdd({ type: 'expense' })}>
                  Add Transaction
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {recentTransactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  category={categoryMap.get(tx.categoryId)}
                  hideBalances={hideBalances}
                  showDate
                  onEdit={(item) =>
                    openQuickAdd({ editingTransaction: item })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
