import type {
  BudgetConfig,
  Category,
  CategoryId,
  EMIItem,
  SavingsGoal,
  SavingsTransfer,
  Transaction,
} from '@/types/finance';
import {
  getDaysInMonth,
  getMonthDateBounds,
  getMonthKeyFromDate,
  getRemainingDaysInMonth,
  getTodayIST,
  toMonthKey,
} from '@/utils/date';

export interface MonthlyFinancialSummary {
  monthKey: string;
  openingBalancePaise: number;
  closingBalancePaise: number;
  availableBalancePaise: number;

  // Income breakdown
  salaryPaise: number;
  parentSupportPaise: number;
  freelancePaise: number;
  otherIncomePaise: number;
  totalIncomePaise: number;

  // Expense breakdown
  fixedExpensesPaise: number;
  variableExpensesPaise: number;
  totalExpensesPaise: number;
  netCashFlowPaise: number;

  // Budget & allowance
  plannedSalaryPaise: number;
  plannedFixedPaymentsPaise: number;
  plannedPersonalBudgetPaise: number;
  remainingPersonalBudgetPaise: number;
  personalBudgetUtilizationPct: number;
  isPersonalBudgetOverspent: boolean;
  overspentPaise: number;
  remainingDaysIncludingToday: number;
  dailySpendingAllowancePaise: number;
}

export interface CategoryBreakdownItem {
  categoryId: CategoryId;
  categoryName: string;
  expenseGroup: 'fixed' | 'variable';
  totalPaise: number;
  percentage: number;
  transactionCount: number;
}

export interface CategoryBudgetStatus {
  categoryId: CategoryId;
  categoryName: string;
  allocatedPaise: number;
  actualPaise: number;
  remainingPaise: number;
  utilizationPct: number;
  hasZeroBudget: boolean;
  isOverspent: boolean;
}

export interface YearlyMonthRow {
  month: number;
  monthKey: string;
  incomePaise: number;
  expensesPaise: number;
  fixedExpensesPaise: number;
  variableExpensesPaise: number;
  parentSupportPaise: number;
  netCashFlowPaise: number;
}

export interface YearlyFinancialSummary {
  year: number;
  totalIncomePaise: number;
  totalExpensesPaise: number;
  totalFixedExpensesPaise: number;
  totalVariableExpensesPaise: number;
  totalParentSupportPaise: number;
  netCashFlowPaise: number;
  months: YearlyMonthRow[];
}

export interface GoalSavingsSummary {
  goal: SavingsGoal;
  depositedPaise: number;
  withdrawnPaise: number;
  currentSavedPaise: number;
  remainingPaise: number;
  progressPct: number;
}

export interface TotalSavingsSummary {
  totalSavedPaise: number;
  totalTargetPaise: number;
  goals: GoalSavingsSummary[];
}

export function buildCategoryMap(categories: Category[]): Map<string, Category> {
  const map = new Map<string, Category>();
  for (const cat of categories) {
    map.set(cat.id, cat);
  }
  return map;
}

export function isFixedExpenseCategory(
  categoryId: CategoryId,
  categoryMap: Map<string, Category>,
): boolean {
  const cat = categoryMap.get(categoryId);
  if (cat) {
    return cat.expenseGroup === 'fixed';
  }
  return (
    categoryId === 'ac_emi' ||
    categoryId === 'parents' ||
    categoryId === 'dad' ||
    categoryId === 'brother_madrasa'
  );
}

/**
 * Calculates carried-forward opening balance for (year, month):
 * Opening Balance = initialOpeningBalancePaise + sum of Net Cash Flow for all months strictly before monthKey.
 */
export function calculateOpeningBalancePaise(
  initialOpeningBalancePaise: number,
  transactions: Transaction[],
  year: number,
  month: number,
): number {
  const monthStart = `${toMonthKey(year, month)}-01`;
  let netPrior = 0;

  for (const tx of transactions) {
    if (tx.date < monthStart) {
      if (tx.type === 'income') {
        netPrior += tx.amountPaise;
      } else {
        netPrior -= tx.amountPaise;
      }
    }
  }

  return initialOpeningBalancePaise + netPrior;
}

/**
 * Calculates all core financial metrics for a given month from transactions & budget configuration.
 * All amounts are integer paise.
 */
export function calculateMonthlySummary(params: {
  year: number;
  month: number;
  transactions: Transaction[];
  categories: Category[];
  budgetConfig: BudgetConfig;
  initialOpeningBalancePaise?: number;
  referenceDateIST?: string;
}): MonthlyFinancialSummary {
  const {
    year,
    month,
    transactions,
    categories,
    budgetConfig,
    initialOpeningBalancePaise = 0,
    referenceDateIST = getTodayIST(),
  } = params;

  const monthKey = toMonthKey(year, month);
  const categoryMap = buildCategoryMap(categories);
  const openingBalancePaise = calculateOpeningBalancePaise(
    initialOpeningBalancePaise,
    transactions,
    year,
    month,
  );

  let salaryPaise = 0;
  let parentSupportPaise = 0;
  let freelancePaise = 0;
  let otherIncomePaise = 0;

  let fixedExpensesPaise = 0;
  let variableExpensesPaise = 0;

  for (const tx of transactions) {
    if (getMonthKeyFromDate(tx.date) !== monthKey) continue;

    if (tx.type === 'income') {
      if (tx.categoryId === 'salary') {
        salaryPaise += tx.amountPaise;
      } else if (tx.categoryId === 'parent_support') {
        parentSupportPaise += tx.amountPaise;
      } else if (tx.categoryId === 'freelance') {
        freelancePaise += tx.amountPaise;
      } else {
        otherIncomePaise += tx.amountPaise;
      }
    } else {
      if (isFixedExpenseCategory(tx.categoryId, categoryMap)) {
        fixedExpensesPaise += tx.amountPaise;
      } else {
        variableExpensesPaise += tx.amountPaise;
      }
    }
  }

  const totalIncomePaise =
    salaryPaise + parentSupportPaise + freelancePaise + otherIncomePaise;
  const totalExpensesPaise = fixedExpensesPaise + variableExpensesPaise;
  const netCashFlowPaise = totalIncomePaise - totalExpensesPaise;
  const availableBalancePaise =
    openingBalancePaise + totalIncomePaise - totalExpensesPaise;

  // Planned budget metrics (never treated as completed transactions)
  const plannedSalaryPaise = budgetConfig.plannedSalaryPaise;
  const plannedFixedPaymentsPaise = budgetConfig.plannedFixedPayments
    .filter((p) => p.active)
    .reduce((sum, p) => sum + p.amountPaise, 0);

  const plannedPersonalBudgetPaise = plannedSalaryPaise - plannedFixedPaymentsPaise;
  const remainingPersonalBudgetPaise =
    plannedPersonalBudgetPaise - variableExpensesPaise;

  let personalBudgetUtilizationPct = 0;
  if (plannedPersonalBudgetPaise > 0) {
    personalBudgetUtilizationPct =
      Math.round((variableExpensesPaise / plannedPersonalBudgetPaise) * 1000) / 10;
  } else if (variableExpensesPaise > 0) {
    personalBudgetUtilizationPct = 100;
  }

  const isPersonalBudgetOverspent = remainingPersonalBudgetPaise < 0;
  const overspentPaise = isPersonalBudgetOverspent
    ? Math.abs(remainingPersonalBudgetPaise)
    : 0;

  const remainingDaysIncludingToday = getRemainingDaysInMonth(
    year,
    month,
    referenceDateIST,
  );

  const dailySpendingAllowancePaise =
    remainingDaysIncludingToday > 0 && remainingPersonalBudgetPaise > 0
      ? Math.floor(remainingPersonalBudgetPaise / remainingDaysIncludingToday)
      : 0;

  return {
    monthKey,
    openingBalancePaise,
    closingBalancePaise: availableBalancePaise,
    availableBalancePaise,
    salaryPaise,
    parentSupportPaise,
    freelancePaise,
    otherIncomePaise,
    totalIncomePaise,
    fixedExpensesPaise,
    variableExpensesPaise,
    totalExpensesPaise,
    netCashFlowPaise,
    plannedSalaryPaise,
    plannedFixedPaymentsPaise,
    plannedPersonalBudgetPaise,
    remainingPersonalBudgetPaise,
    personalBudgetUtilizationPct,
    isPersonalBudgetOverspent,
    overspentPaise,
    remainingDaysIncludingToday,
    dailySpendingAllowancePaise,
  };
}

/**
 * Expense breakdown by category for a list of transactions (typically filtered to a period).
 */
export function calculateExpenseBreakdown(
  transactions: Transaction[],
  categories: Category[],
): CategoryBreakdownItem[] {
  const categoryMap = buildCategoryMap(categories);
  const totals = new Map<CategoryId, { totalPaise: number; count: number }>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    grandTotal += tx.amountPaise;
    const prev = totals.get(tx.categoryId) ?? { totalPaise: 0, count: 0 };
    totals.set(tx.categoryId, {
      totalPaise: prev.totalPaise + tx.amountPaise,
      count: prev.count + 1,
    });
  }

  const result: CategoryBreakdownItem[] = [];
  for (const [categoryId, stats] of totals.entries()) {
    const cat = categoryMap.get(categoryId);
    result.push({
      categoryId,
      categoryName: cat?.name ?? categoryId,
      expenseGroup: isFixedExpenseCategory(categoryId, categoryMap)
        ? 'fixed'
        : 'variable',
      totalPaise: stats.totalPaise,
      percentage:
        grandTotal > 0
          ? Math.round((stats.totalPaise / grandTotal) * 1000) / 10
          : 0,
      transactionCount: stats.count,
    });
  }

  return result.sort((a, b) => b.totalPaise - a.totalPaise);
}

/**
 * Category-wise personal budget allocation vs actual spending.
 * Handles zero budgets without NaN or Infinity.
 */
export function calculateCategoryBudgetStatuses(
  budgetConfig: BudgetConfig,
  transactionsInPeriod: Transaction[],
  categories: Category[],
): CategoryBudgetStatus[] {
  const categoryMap = buildCategoryMap(categories);
  const actualByCategory = new Map<string, number>();

  for (const tx of transactionsInPeriod) {
    if (tx.type !== 'expense') continue;
    actualByCategory.set(
      tx.categoryId,
      (actualByCategory.get(tx.categoryId) ?? 0) + tx.amountPaise,
    );
  }

  const variableCategories = categories.filter(
    (c) => c.type === 'expense' && c.expenseGroup !== 'fixed',
  );

  const seen = new Set<string>();
  const statuses: CategoryBudgetStatus[] = [];

  for (const cat of variableCategories) {
    seen.add(cat.id);
    const allocatedPaise = Math.max(
      0,
      budgetConfig.categoryAllocationsPaise[cat.id] ?? 0,
    );
    const actualPaise = actualByCategory.get(cat.id) ?? 0;
    const remainingPaise = allocatedPaise - actualPaise;
    const hasZeroBudget = allocatedPaise === 0;

    let utilizationPct = 0;
    if (allocatedPaise > 0) {
      utilizationPct = Math.round((actualPaise / allocatedPaise) * 1000) / 10;
    } else if (actualPaise > 0) {
      utilizationPct = 100;
    }

    const isOverspent =
      (allocatedPaise > 0 && actualPaise > allocatedPaise) ||
      (allocatedPaise === 0 && actualPaise > 0);

    statuses.push({
      categoryId: cat.id,
      categoryName: cat.name,
      allocatedPaise,
      actualPaise,
      remainingPaise,
      utilizationPct,
      hasZeroBudget,
      isOverspent,
    });
  }

  // Include any allocated keys not in default variableCategories
  for (const [catId, allocatedRaw] of Object.entries(
    budgetConfig.categoryAllocationsPaise,
  )) {
    if (seen.has(catId)) continue;
    const cat = categoryMap.get(catId);
    const allocatedPaise = Math.max(0, allocatedRaw);
    const actualPaise = actualByCategory.get(catId) ?? 0;
    const remainingPaise = allocatedPaise - actualPaise;
    const hasZeroBudget = allocatedPaise === 0;
    const utilizationPct =
      allocatedPaise > 0
        ? Math.round((actualPaise / allocatedPaise) * 1000) / 10
        : actualPaise > 0
          ? 100
          : 0;
    statuses.push({
      categoryId: catId,
      categoryName: cat?.name ?? catId,
      allocatedPaise,
      actualPaise,
      remainingPaise,
      utilizationPct,
      hasZeroBudget,
      isOverspent: actualPaise > allocatedPaise,
    });
  }

  return statuses;
}

/**
 * Daily spending trend points for a month (day 1..daysInMonth).
 */
export function calculateDailySpendingSeries(
  year: number,
  month: number,
  transactions: Transaction[],
): Array<{ day: number; label: string; expensePaise: number; incomePaise: number }> {
  const days = getDaysInMonth(year, month);
  const { start, end } = getMonthDateBounds(year, month);
  const dayIncome = new Array<number>(days + 1).fill(0);
  const dayExpense = new Array<number>(days + 1).fill(0);

  for (const tx of transactions) {
    if (tx.date < start || tx.date > end) continue;
    const day = parseInt(tx.date.slice(8, 10), 10);
    if (day < 1 || day > days) continue;
    if (tx.type === 'income') {
      dayIncome[day] += tx.amountPaise;
    } else {
      dayExpense[day] += tx.amountPaise;
    }
  }

  const series: Array<{
    day: number;
    label: string;
    expensePaise: number;
    incomePaise: number;
  }> = [];

  for (let d = 1; d <= days; d++) {
    series.push({
      day: d,
      label: String(d),
      expensePaise: dayExpense[d],
      incomePaise: dayIncome[d],
    });
  }

  return series;
}

/**
 * Yearly aggregation across all 12 months from the same transaction source.
 */
export function calculateYearlySummary(
  year: number,
  transactions: Transaction[],
  categories: Category[],
): YearlyFinancialSummary {
  const categoryMap = buildCategoryMap(categories);
  const months: YearlyMonthRow[] = Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1;
    return {
      month,
      monthKey: toMonthKey(year, month),
      incomePaise: 0,
      expensesPaise: 0,
      fixedExpensesPaise: 0,
      variableExpensesPaise: 0,
      parentSupportPaise: 0,
      netCashFlowPaise: 0,
    };
  });

  for (const tx of transactions) {
    const txYear = parseInt(tx.date.slice(0, 4), 10);
    if (txYear !== year) continue;
    const txMonth = parseInt(tx.date.slice(5, 7), 10);
    if (txMonth < 1 || txMonth > 12) continue;

    const row = months[txMonth - 1];
    if (tx.type === 'income') {
      row.incomePaise += tx.amountPaise;
      if (tx.categoryId === 'parent_support') {
        row.parentSupportPaise += tx.amountPaise;
      }
    } else {
      row.expensesPaise += tx.amountPaise;
      if (isFixedExpenseCategory(tx.categoryId, categoryMap)) {
        row.fixedExpensesPaise += tx.amountPaise;
      } else {
        row.variableExpensesPaise += tx.amountPaise;
      }
    }
  }

  let totalIncomePaise = 0;
  let totalExpensesPaise = 0;
  let totalFixedExpensesPaise = 0;
  let totalVariableExpensesPaise = 0;
  let totalParentSupportPaise = 0;

  for (const row of months) {
    row.netCashFlowPaise = row.incomePaise - row.expensesPaise;
    totalIncomePaise += row.incomePaise;
    totalExpensesPaise += row.expensesPaise;
    totalFixedExpensesPaise += row.fixedExpensesPaise;
    totalVariableExpensesPaise += row.variableExpensesPaise;
    totalParentSupportPaise += row.parentSupportPaise;
  }

  return {
    year,
    totalIncomePaise,
    totalExpensesPaise,
    totalFixedExpensesPaise,
    totalVariableExpensesPaise,
    totalParentSupportPaise,
    netCashFlowPaise: totalIncomePaise - totalExpensesPaise,
    months,
  };
}

/**
 * Checks whether an EMI installment payment for installmentKey can be recorded without duplication.
 */
export function canRecordEMIPayment(
  emi: EMIItem,
  installmentKey: string,
  existingTransactions: Transaction[] = [],
): { allowed: boolean; reason?: string } {
  if (emi.status === 'completed') {
    return { allowed: false, reason: 'This EMI is already completed.' };
  }
  if (emi.status === 'paused') {
    return { allowed: false, reason: 'This EMI is currently paused.' };
  }
  if (
    emi.totalInstallments !== null &&
    emi.payments.length >= emi.totalInstallments
  ) {
    return {
      allowed: false,
      reason: 'All configured installments for this EMI have been paid.',
    };
  }
  const duplicateRecord = emi.payments.some(
    (p) => p.installmentKey === installmentKey,
  );
  if (duplicateRecord) {
    return {
      allowed: false,
      reason: `Installment for ${installmentKey} has already been paid.`,
    };
  }
  const duplicateTx = existingTransactions.some(
    (tx) =>
      tx.emiId === emi.id && tx.emiInstallmentKey === installmentKey,
  );
  if (duplicateTx) {
    return {
      allowed: false,
      reason: `A transaction for ${installmentKey} already exists.`,
    };
  }
  return { allowed: true };
}

export function getEMIDueDateForMonth(
  dueDay: number,
  year: number,
  month: number,
): string {
  const maxDay = getDaysInMonth(year, month);
  const clampedDay = Math.min(Math.max(1, dueDay), maxDay);
  return `${toMonthKey(year, month)}-${String(clampedDay).padStart(2, '0')}`;
}

/**
 * Computes savings goal totals independently of expense reports.
 */
export function calculateSavingsSummary(
  goals: SavingsGoal[],
  transfers: SavingsTransfer[],
): TotalSavingsSummary {
  const stats = new Map<string, { deposited: number; withdrawn: number }>();

  for (const t of transfers) {
    const prev = stats.get(t.goalId) ?? { deposited: 0, withdrawn: 0 };
    if (t.type === 'deposit') {
      prev.deposited += t.amountPaise;
    } else {
      prev.withdrawn += t.amountPaise;
    }
    stats.set(t.goalId, prev);
  }

  let totalSavedPaise = 0;
  let totalTargetPaise = 0;

  const goalSummaries: GoalSavingsSummary[] = goals.map((goal) => {
    const s = stats.get(goal.id) ?? { deposited: 0, withdrawn: 0 };
    const currentSavedPaise = Math.max(0, s.deposited - s.withdrawn);
    const remainingPaise = Math.max(0, goal.targetPaise - currentSavedPaise);
    const progressPct =
      goal.targetPaise > 0
        ? Math.min(
            100,
            Math.round((currentSavedPaise / goal.targetPaise) * 1000) / 10,
          )
        : 0;

    totalSavedPaise += currentSavedPaise;
    totalTargetPaise += goal.targetPaise;

    return {
      goal,
      depositedPaise: s.deposited,
      withdrawnPaise: s.withdrawn,
      currentSavedPaise,
      remainingPaise,
      progressPct,
    };
  });

  return {
    totalSavedPaise,
    totalTargetPaise,
    goals: goalSummaries,
  };
}
