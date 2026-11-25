import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Pencil,
  Wallet,
} from 'lucide-react';
import { BudgetProgressCard } from '@/components/finance/BudgetProgressCard';
import { StatCard } from '@/components/finance/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Modal } from '@/components/ui/Modal';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useFinance } from '@/contexts/FinanceContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { BudgetConfig } from '@/types/finance';
import {
  formatINR,
  formatRupeeInputValue,
  rupeesToPaise,
} from '@/utils/currency';
import { formatMonthYear } from '@/utils/date';

export function BudgetPage() {
  const {
    selectedMonthYear,
    budgetConfig,
    summary,
    categoryBudgetStatuses,
    categories,
    hideBalances,
    saveBudgetConfig,
  } = useFinance();

  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);

  const [plannedSalaryInput, setPlannedSalaryInput] = useState('');
  const [fixedInputs, setFixedInputs] = useState<Record<string, string>>({});
  const [allocInputs, setAllocInputs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = () => {
    setPlannedSalaryInput(
      formatRupeeInputValue(budgetConfig.plannedSalaryPaise),
    );
    const fx: Record<string, string> = {};
    for (const fp of budgetConfig.plannedFixedPayments) {
      fx[fp.id] = formatRupeeInputValue(fp.amountPaise);
    }
    setFixedInputs(fx);

    const al: Record<string, string> = {};
    for (const cat of categories) {
      if (cat.type === 'expense' && cat.expenseGroup !== 'fixed') {
        al[cat.id] = formatRupeeInputValue(
          budgetConfig.categoryAllocationsPaise[cat.id] ?? 0,
        );
      }
    }
    setAllocInputs(al);
    setEditOpen(true);
  };

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const monthLabel = formatMonthYear(
    selectedMonthYear.year,
    selectedMonthYear.month,
  );

  const draftPlannedSalary = rupeesToPaise(plannedSalaryInput);
  const draftFixedTotal = budgetConfig.plannedFixedPayments.reduce(
    (sum, fp) => sum + rupeesToPaise(fixedInputs[fp.id] ?? '0'),
    0,
  );
  const draftPersonalBudget = draftPlannedSalary - draftFixedTotal;
  const draftAllocatedSum = Object.values(allocInputs).reduce(
    (sum, v) => sum + rupeesToPaise(v),
    0,
  );

  const handleSaveBudget = async () => {
    setIsSaving(true);
    try {
      const nextAllocations: Record<string, number> = {};
      for (const [catId, strVal] of Object.entries(allocInputs)) {
        nextAllocations[catId] = rupeesToPaise(strVal);
      }

      const nextConfig: BudgetConfig = {
        ...budgetConfig,
        plannedSalaryPaise: draftPlannedSalary,
        plannedFixedPayments: budgetConfig.plannedFixedPayments.map((fp) => ({
          ...fp,
          amountPaise: rupeesToPaise(fixedInputs[fp.id] ?? '0'),
        })),
        categoryAllocationsPaise: nextAllocations,
      };
      await saveBudgetConfig(nextConfig);
      setEditOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const editFormBody = (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-surface-secondary/50 p-4 space-y-3">
        <CurrencyInput
          label="Planned Monthly Salary"
          value={plannedSalaryInput}
          onChange={setPlannedSalaryInput}
        />
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted-foreground">
            Resulting Planned Personal Budget:
          </span>
          <strong className="text-sm font-extrabold text-foreground tabular-nums">
            {formatINR(draftPersonalBudget)}
          </strong>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Planned Fixed Commitments
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {budgetConfig.plannedFixedPayments.map((fp) => (
            <CurrencyInput
              key={fp.id}
              label={fp.label}
              value={fixedInputs[fp.id] ?? ''}
              onChange={(val) =>
                setFixedInputs((prev) => ({ ...prev, [fp.id]: val }))
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Personal Category Allocations
          </p>
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            Allocated: {formatINR(draftAllocatedSum)}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
          {categories
            .filter((c) => c.type === 'expense' && c.expenseGroup !== 'fixed')
            .map((cat) => (
              <CurrencyInput
                key={cat.id}
                label={cat.name}
                value={allocInputs[cat.id] ?? ''}
                onChange={(val) =>
                  setAllocInputs((prev) => ({ ...prev, [cat.id]: val }))
                }
              />
            ))}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        <Button variant="outline" onClick={() => setEditOpen(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveBudget}
          isLoading={isSaving}
          leftIcon={<Check className="h-4 w-4" />}
        >
          Save Budget Plan
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly Plan vs Actual • {monthLabel}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Monthly Budget & Allowance
          </h2>
        </div>

        <Button
          onClick={openEditModal}
          leftIcon={<Pencil className="h-4 w-4" />}
        >
          Edit Budget Plan
        </Button>
      </div>

      {/* Salary -> Fixed -> Personal Breakdown Banner */}
      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card dark:shadow-card-dark space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="rounded-2xl border border-border bg-surface-secondary/50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Planned Salary
            </span>
            <p className="mt-1 text-2xl font-extrabold text-foreground tabular-nums">
              {formatINR(summary.plannedSalaryPaise, {
                hideValue: hideBalances,
              })}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-secondary/50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              − Planned Fixed Payments
            </span>
            <p className="mt-1 text-2xl font-extrabold text-foreground tabular-nums">
              {formatINR(summary.plannedFixedPaymentsPaise, {
                hideValue: hideBalances,
              })}
            </p>
          </div>
          <div className="rounded-2xl border border-foreground/40 bg-primary text-primary-foreground p-4">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
              = Planned Personal Budget
            </span>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              {formatINR(summary.plannedPersonalBudgetPaise, {
                hideValue: hideBalances,
              })}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Planned payments are projections only and are never counted as
          completed transactions until you record them.
        </p>
      </section>

      {/* Personal Budget Utilization KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Actual Personal Spent"
          value={formatINR(summary.variableExpensesPaise, {
            hideValue: hideBalances,
          })}
          icon={<Wallet className="h-4 w-4" />}
          subtitle={`${summary.personalBudgetUtilizationPct}% of personal budget`}
        />
        <StatCard
          label="Remaining Personal Budget"
          value={formatINR(summary.remainingPersonalBudgetPaise, {
            hideValue: hideBalances,
          })}
          icon={
            summary.isPersonalBudgetOverspent ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Wallet className="h-4 w-4" />
            )
          }
          emphasized={summary.isPersonalBudgetOverspent}
          badge={
            summary.isPersonalBudgetOverspent ? 'Overspent' : 'Within Plan'
          }
          subtitle={
            summary.isPersonalBudgetOverspent
              ? `Exceeded by ${formatINR(summary.overspentPaise, {
                  hideValue: hideBalances,
                })}`
              : 'Available for personal categories'
          }
        />
        <StatCard
          label="Remaining Days"
          value={`${summary.remainingDaysIncludingToday} days`}
          icon={<CalendarDays className="h-4 w-4" />}
          subtitle="Including today (Asia/Kolkata)"
        />
        <StatCard
          label="Recommended Daily Allowance"
          value={formatINR(summary.dailySpendingAllowancePaise, {
            hideValue: hideBalances,
          })}
          icon={<Wallet className="h-4 w-4" />}
          subtitle="Remaining personal budget / remaining days"
        />
      </div>

      {/* Category-wise Personal Budget Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Category-wise Personal Allocations
            </h3>
            <p className="text-xs text-muted-foreground">
              Compare allocated limits against actual spending per category
            </p>
          </div>
          <Badge variant="outline">Monochrome Utilization</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryBudgetStatuses.map((status) => (
            <BudgetProgressCard
              key={status.categoryId}
              title={status.categoryName}
              icon={categoryMap.get(status.categoryId)?.icon}
              allocatedPaise={status.allocatedPaise}
              actualPaise={status.actualPaise}
              remainingPaise={status.remainingPaise}
              utilizationPct={status.utilizationPct}
              isOverspent={status.isOverspent}
              hasZeroBudget={status.hasZeroBudget}
              hideBalances={hideBalances}
            />
          ))}
        </div>
      </section>

      {isMobile ? (
        <BottomSheet
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Monthly Budget"
          description="Adjust salary plan, fixed commitments, and category limits."
        >
          {editFormBody}
        </BottomSheet>
      ) : (
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Monthly Budget"
          description="Adjust salary plan, fixed commitments, and category limits."
          maxWidthClass="max-w-2xl"
        >
          {editFormBody}
        </Modal>
      )}
    </div>
  );
}
