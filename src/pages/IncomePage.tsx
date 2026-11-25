import { useMemo } from 'react';
import {
  Briefcase,
  HeartHandshake,
  Laptop,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/finance/StatCard';
import { TransactionCard } from '@/components/finance/TransactionCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFinance } from '@/contexts/FinanceContext';
import { formatINR } from '@/utils/currency';
import { formatMonthYear } from '@/utils/date';

export function IncomePage() {
  const {
    monthTransactions,
    categories,
    selectedMonthYear,
    summary,
    hideBalances,
    openQuickAdd,
  } = useFinance();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const incomeTransactions = useMemo(
    () => monthTransactions.filter((tx) => tx.type === 'income'),
    [monthTransactions],
  );

  const salaryHistory = useMemo(
    () => incomeTransactions.filter((tx) => tx.categoryId === 'salary'),
    [incomeTransactions],
  );

  const parentSupportHistory = useMemo(
    () =>
      incomeTransactions.filter((tx) => tx.categoryId === 'parent_support'),
    [incomeTransactions],
  );

  const otherIncomeHistory = useMemo(
    () =>
      incomeTransactions.filter(
        (tx) =>
          tx.categoryId !== 'salary' && tx.categoryId !== 'parent_support',
      ),
    [incomeTransactions],
  );

  const monthLabel = formatMonthYear(
    selectedMonthYear.year,
    selectedMonthYear.month,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Income Streams • {monthLabel}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Salary & Support Ledger
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              openQuickAdd({ type: 'income', categoryId: 'parent_support' })
            }
            leftIcon={<HeartHandshake className="h-4 w-4" />}
          >
            Add Parent Support
          </Button>
          <Button
            onClick={() =>
              openQuickAdd({ type: 'income', categoryId: 'salary' })
            }
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Income
          </Button>
        </div>
      </div>

      {/* Income Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Monthly Income"
          value={formatINR(summary.totalIncomePaise, { hideValue: hideBalances })}
          icon={<TrendingUp className="h-4 w-4" />}
          subtitle={`${incomeTransactions.length} entries recorded`}
          emphasized
        />
        <StatCard
          label="Salary Income"
          value={formatINR(summary.salaryPaise, { hideValue: hideBalances })}
          icon={<Briefcase className="h-4 w-4" />}
          badge="Earned"
          subtitle={`Planned: ${formatINR(summary.plannedSalaryPaise, {
            hideValue: hideBalances,
          })}`}
        />
        <StatCard
          label="Parent Support Received"
          value={formatINR(summary.parentSupportPaise, {
            hideValue: hideBalances,
          })}
          icon={<HeartHandshake className="h-4 w-4" />}
          badge="Separate"
          subtitle="Kept visually separate from salary"
        />
        <StatCard
          label="Additional Income"
          value={formatINR(
            summary.freelancePaise + summary.otherIncomePaise,
            { hideValue: hideBalances },
          )}
          icon={<Laptop className="h-4 w-4" />}
          subtitle="Freelance & other sources"
        />
      </div>

      {/* Visually Separated Salary vs Parent Support Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Salary Received
                </h3>
                <p className="text-xs text-muted-foreground">
                  Primary monthly earnings
                </p>
              </div>
            </div>
            <span className="text-lg font-extrabold text-foreground tabular-nums">
              {formatINR(summary.salaryPaise, { hideValue: hideBalances })}
            </span>
          </div>

          {salaryHistory.length === 0 ? (
            <EmptyState
              title="No salary recorded yet"
              description={`Record your ${monthLabel} salary when credited.`}
              action={
                <Button
                  size="sm"
                  onClick={() =>
                    openQuickAdd({ type: 'income', categoryId: 'salary' })
                  }
                >
                  Record Salary
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {salaryHistory.map((tx) => (
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
        </section>

        <section className="rounded-[24px] border border-dashed border-foreground/35 bg-surface-secondary/40 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Extra from Parents
                </h3>
                <p className="text-xs text-muted-foreground">
                  Additional family support tracked independently
                </p>
              </div>
            </div>
            <span className="text-lg font-extrabold text-foreground tabular-nums">
              {formatINR(summary.parentSupportPaise, {
                hideValue: hideBalances,
              })}
            </span>
          </div>

          {parentSupportHistory.length === 0 ? (
            <EmptyState
              title="No parent support this month"
              description="Any additional money received from parents appears here separately."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    openQuickAdd({
                      type: 'income',
                      categoryId: 'parent_support',
                    })
                  }
                >
                  Add Parent Support
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {parentSupportHistory.map((tx) => (
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
        </section>
      </div>

      {/* Freelance & Other Income History */}
      <section className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Freelance & Other Income
            </h3>
            <p className="text-xs text-muted-foreground">
              Side projects, reimbursements, and miscellaneous credits
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              openQuickAdd({ type: 'income', categoryId: 'freelance' })
            }
          >
            Add Entry
          </Button>
        </div>

        {otherIncomeHistory.length === 0 ? (
          <EmptyState
            title="No additional income entries"
            description={`Freelance or other income recorded in ${monthLabel} will show here.`}
          />
        ) : (
          <div className="space-y-2.5">
            {otherIncomeHistory.map((tx) => (
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
      </section>
    </div>
  );
}
