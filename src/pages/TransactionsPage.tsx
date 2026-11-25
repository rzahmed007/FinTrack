import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { TransactionCard } from '@/components/finance/TransactionCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useFinance } from '@/contexts/FinanceContext';
import type { Transaction } from '@/types/finance';
import { formatINR } from '@/utils/currency';
import { formatDateDisplay, formatMonthYear, getMonthKeyFromDate, toMonthKey } from '@/utils/date';

export function TransactionsPage() {
  const {
    transactions,
    categories,
    selectedMonthYear,
    hideBalances,
    openQuickAdd,
    deleteTransaction,
  } = useFinance();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'month' | 'all'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const monthKey = toMonthKey(selectedMonthYear.year, selectedMonthYear.month);
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (scopeFilter === 'month' && getMonthKeyFromDate(tx.date) !== monthKey) {
        return false;
      }
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) {
        return false;
      }
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      if (q) {
        const catName = (
          categoryMap.get(tx.categoryId)?.name ?? tx.categoryId
        ).toLowerCase();
        const note = (tx.note ?? '').toLowerCase();
        if (!catName.includes(q) && !note.includes(q) && !tx.date.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    scopeFilter,
    monthKey,
    typeFilter,
    categoryFilter,
    startDate,
    endDate,
    search,
    categoryMap,
  ]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<
      string,
      {
        date: string;
        items: Transaction[];
        incomePaise: number;
        expensePaise: number;
      }
    >();

    for (const tx of filtered) {
      const existing = groups.get(tx.date) ?? {
        date: tx.date,
        items: [],
        incomePaise: 0,
        expensePaise: 0,
      };
      existing.items.push(tx);
      if (tx.type === 'income') {
        existing.incomePaise += tx.amountPaise;
      } else {
        existing.expensePaise += tx.amountPaise;
      }
      groups.set(tx.date, existing);
    }

    return Array.from(groups.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [filtered]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.type === 'income') income += tx.amountPaise;
      else expense += tx.amountPaise;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const hasFilters =
    Boolean(search) ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    scopeFilter !== 'month';

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setScopeFilter('month');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unified Ledger
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {scopeFilter === 'month'
              ? formatMonthYear(selectedMonthYear.year, selectedMonthYear.month)
              : 'All Recorded Transactions'}
          </h2>
        </div>

        <Button
          onClick={() => openQuickAdd({ type: 'expense' })}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Transaction
        </Button>
      </div>

      {/* Filter Bar */}
      <section className="rounded-[24px] border border-border bg-surface p-4 sm:p-5 shadow-card dark:shadow-card-dark space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Search notes, category, date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAdornment={<Search className="h-4 w-4" />}
          />

          <Select
            aria-label="Period scope"
            value={scopeFilter}
            onChange={(e) =>
              setScopeFilter(e.target.value as 'month' | 'all')
            }
            options={[
              {
                value: 'month',
                label: `Selected Month (${monthKey})`,
              },
              { value: 'all', label: 'All Months' },
            ]}
          />

          <Select
            aria-label="Transaction type filter"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as 'all' | 'income' | 'expense')
            }
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'expense', label: 'Expenses Only' },
              { value: 'income', label: 'Income Only' },
            ]}
          />

          <Select
            aria-label="Category filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.type})`,
              })),
            ]}
          />

          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button
                variant="outline"
                size="md"
                onClick={resetFilters}
                leftIcon={<X className="h-4 w-4" />}
                className="w-full"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-border/70">
          <DatePicker
            label="From Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value) setScopeFilter('all');
            }}
          />
          <DatePicker
            label="To Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              if (e.target.value) setScopeFilter('all');
            }}
          />
          <div className="sm:col-span-2 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-surface-secondary/50 px-4 py-2.5 text-xs">
            <div>
              <span className="text-muted-foreground">Filtered Income</span>
              <p className="font-bold text-foreground tabular-nums text-sm">
                {formatINR(totals.income, {
                  showSign: true,
                  hideValue: hideBalances,
                })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Filtered Expenses</span>
              <p className="font-bold text-foreground tabular-nums text-sm">
                {formatINR(-totals.expense, {
                  showSign: true,
                  hideValue: hideBalances,
                })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Net</span>
              <p className="font-extrabold text-foreground tabular-nums text-sm">
                {formatINR(totals.net, {
                  showSign: true,
                  hideValue: hideBalances,
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transactions Content */}
      {groupedByDate.length === 0 ? (
        <EmptyState
          title="No matching transactions"
          description="Try clearing filters or add a new transaction."
          action={
            <div className="flex flex-wrap gap-2 justify-center">
              {hasFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  Clear Filters
                </Button>
              )}
              <Button onClick={() => openQuickAdd({ type: 'expense' })}>
                Add Transaction
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {/* Mobile Grouped List */}
          <div className="space-y-5 md:hidden">
            {groupedByDate.map((group) => (
              <div key={group.date} className="space-y-2.5">
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground">
                    {formatDateDisplay(group.date, 'dayHeader')}
                  </span>
                  <span className="font-bold text-foreground tabular-nums">
                    Day Net:{' '}
                    {formatINR(group.incomePaise - group.expensePaise, {
                      showSign: true,
                      hideValue: hideBalances,
                    })}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      category={categoryMap.get(tx.categoryId)}
                      hideBalances={hideBalances}
                      onEdit={(item) =>
                        openQuickAdd({ editingTransaction: item })
                      }
                      onDelete={(item) => setDeleteTarget(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Professional Grouped Data Table */}
          <div className="hidden md:block space-y-5">
            {groupedByDate.map((group) => (
              <section
                key={group.date}
                className="overflow-hidden rounded-[24px] border border-border bg-surface shadow-card dark:shadow-card-dark"
              >
                <div className="flex items-center justify-between border-b border-border bg-surface-secondary/60 px-6 py-3 text-xs">
                  <span className="font-bold uppercase tracking-wider text-foreground">
                    {formatDateDisplay(group.date, 'dayHeader')}
                  </span>
                  <div className="flex items-center gap-4 tabular-nums">
                    {group.incomePaise > 0 && (
                      <span className="text-muted-foreground">
                        In:{' '}
                        <strong className="text-foreground">
                          {formatINR(group.incomePaise, {
                            showSign: true,
                            hideValue: hideBalances,
                          })}
                        </strong>
                      </span>
                    )}
                    {group.expensePaise > 0 && (
                      <span className="text-muted-foreground">
                        Out:{' '}
                        <strong className="text-foreground">
                          {formatINR(-group.expensePaise, {
                            showSign: true,
                            hideValue: hideBalances,
                          })}
                        </strong>
                      </span>
                    )}
                    <span className="font-bold text-foreground">
                      Daily Total:{' '}
                      {formatINR(group.incomePaise - group.expensePaise, {
                        showSign: true,
                        hideValue: hideBalances,
                      })}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-border">
                    {group.items.map((tx) => {
                      const cat = categoryMap.get(tx.categoryId);
                      const isIncome = tx.type === 'income';
                      return (
                        <tr
                          key={tx.id}
                          className="transition-colors hover:bg-surface-hover/50"
                        >
                          <td className="px-6 py-3.5 w-[240px]">
                            <div className="flex items-center gap-3">
                              <span
                                className={
                                  isIncome
                                    ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'
                                    : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-foreground'
                                }
                              >
                                <CategoryIcon
                                  icon={cat?.icon}
                                  className="h-4 w-4"
                                />
                              </span>
                              <span className="font-bold text-foreground">
                                {cat?.name ?? tx.categoryId}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isIncome ? (
                                <Badge variant="solid">Income</Badge>
                              ) : cat?.expenseGroup === 'fixed' ? (
                                <Badge variant="default">Fixed Expense</Badge>
                              ) : (
                                <Badge variant="outline">Personal</Badge>
                              )}
                              {tx.categoryId === 'parent_support' && (
                                <Badge variant="outline">Parent Support</Badge>
                              )}
                              {tx.emiId && <Badge variant="striped">EMI</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {tx.note || '—'}
                          </td>
                          <td className="px-6 py-3.5 text-right font-extrabold text-foreground tabular-nums whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              {isIncome ? (
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              {formatINR(
                                isIncome ? tx.amountPaise : -tx.amountPaise,
                                { showSign: true, hideValue: hideBalances },
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right w-[108px]">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickAdd({ editingTransaction: tx })
                                }
                                aria-label="Edit transaction"
                                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(tx)}
                                aria-label="Delete transaction"
                                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        </>
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Transaction?"
        description={
          deleteTarget
            ? `This will permanently remove the ${deleteTarget.type} of ${formatINR(
                deleteTarget.amountPaise,
              )} on ${formatDateDisplay(deleteTarget.date, 'medium')} and recalculate all balances.`
            : ''
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
