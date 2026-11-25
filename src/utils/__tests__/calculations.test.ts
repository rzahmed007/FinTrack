import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_USER_ID,
  createDefaultBudgetConfig,
} from '@/data/defaults';
import type { EMIItem, SavingsGoal, SavingsTransfer, Transaction } from '@/types/finance';
import {
  calculateCategoryBudgetStatuses,
  calculateMonthlySummary,
  calculateOpeningBalancePaise,
  calculateSavingsSummary,
  calculateYearlySummary,
  canRecordEMIPayment,
} from '@/utils/calculations';
import { formatINR, rupeesToPaise } from '@/utils/currency';
import { getRemainingDaysInMonth } from '@/utils/date';

const makeTx = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx_1',
  userId: DEFAULT_USER_ID,
  type: 'expense',
  amountPaise: 10000,
  categoryId: 'food',
  date: '2026-11-10',
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-10T10:00:00.000Z',
  ...overrides,
});

describe('Currency integer paise conversion & formatting', () => {
  it('avoids floating point errors when converting rupees to paise', () => {
    expect(rupeesToPaise('19.99')).toBe(1999);
    expect(rupeesToPaise('15,000')).toBe(1500000);
    expect(rupeesToPaise('3300.50')).toBe(330050);
    expect(rupeesToPaise(11900)).toBe(1190000);
  });

  it('formats INR using en-IN grouping without decimals for whole rupees', () => {
    expect(formatINR(1500000)).toBe('₹15,000');
    expect(formatINR(1190000)).toBe('₹11,900');
    expect(formatINR(12500000)).toBe('₹1,25,000');
    expect(formatINR(1999)).toBe('₹19.99');
    expect(formatINR(-50000)).toBe('−₹500');
    expect(formatINR(1500000, { hideValue: true })).toBe('₹•••••');
  });
});

describe('Financial calculation engine', () => {
  it('calculates default planned personal budget (₹15,000 - ₹11,900 = ₹3,100)', () => {
    const budget = createDefaultBudgetConfig(DEFAULT_USER_ID, '2026-11');
    const summary = calculateMonthlySummary({
      year: 2026,
      month: 11,
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budgetConfig: budget,
      referenceDateIST: '2026-11-26',
    });

    expect(summary.plannedSalaryPaise).toBe(1500000);
    expect(summary.plannedFixedPaymentsPaise).toBe(1190000);
    expect(summary.plannedPersonalBudgetPaise).toBe(310000);
    // Planned payments are never counted as completed transactions
    expect(summary.totalExpensesPaise).toBe(0);
    expect(summary.totalIncomePaise).toBe(0);
  });

  it('separates salary, parent support, fixed expenses, and variable expenses accurately', () => {
    const budget = createDefaultBudgetConfig(DEFAULT_USER_ID, '2026-11');
    const txs: Transaction[] = [
      makeTx({ id: 't1', type: 'income', categoryId: 'salary', amountPaise: 1500000 }),
      makeTx({ id: 't2', type: 'income', categoryId: 'parent_support', amountPaise: 200000 }),
      makeTx({ id: 't3', type: 'expense', categoryId: 'parents', amountPaise: 500000 }),
      makeTx({ id: 't4', type: 'expense', categoryId: 'ac_emi', amountPaise: 330000 }),
      makeTx({ id: 't5', type: 'expense', categoryId: 'petrol', amountPaise: 60000 }),
      makeTx({ id: 't6', type: 'expense', categoryId: 'food', amountPaise: 50000 }),
    ];

    const summary = calculateMonthlySummary({
      year: 2026,
      month: 11,
      transactions: txs,
      categories: DEFAULT_CATEGORIES,
      budgetConfig: budget,
      initialOpeningBalancePaise: 100000, // ₹1,000
      referenceDateIST: '2026-11-26', // Nov has 30 days -> 5 remaining days including 26th
    });

    expect(summary.salaryPaise).toBe(1500000);
    expect(summary.parentSupportPaise).toBe(200000);
    expect(summary.totalIncomePaise).toBe(1700000);
    expect(summary.fixedExpensesPaise).toBe(830000);
    expect(summary.variableExpensesPaise).toBe(110000);
    expect(summary.totalExpensesPaise).toBe(940000);
    expect(summary.netCashFlowPaise).toBe(760000);
    expect(summary.availableBalancePaise).toBe(860000);
    // Remaining personal budget = 3,100 - 1,100 = 2,000 (200000 paise)
    expect(summary.remainingPersonalBudgetPaise).toBe(200000);
    // 5 days left (26, 27, 28, 29, 30) -> 200000 / 5 = 40000 paise (₹400/day)
    expect(summary.remainingDaysIncludingToday).toBe(5);
    expect(summary.dailySpendingAllowancePaise).toBe(40000);
  });

  it('carries forward actual closing balances across months', () => {
    const txs: Transaction[] = [
      makeTx({ id: 's1', type: 'income', categoryId: 'salary', amountPaise: 1500000, date: '2026-09-01' }),
      makeTx({ id: 'e1', type: 'expense', categoryId: 'parents', amountPaise: 500000, date: '2026-09-03' }),
      makeTx({ id: 's2', type: 'income', categoryId: 'salary', amountPaise: 1500000, date: '2026-10-01' }),
      makeTx({ id: 'e2', type: 'expense', categoryId: 'ac_emi', amountPaise: 330000, date: '2026-10-05' }),
      makeTx({ id: 'e3', type: 'expense', categoryId: 'food', amountPaise: 70000, date: '2026-11-02' }),
    ];

    // Before Oct: +10,000 + initial 2,000 = 12,000
    expect(calculateOpeningBalancePaise(200000, txs, 2026, 10)).toBe(1200000);
    // Before Nov: +10,000 + (15,000 - 3,300) + initial 2,000 = 23,700
    expect(calculateOpeningBalancePaise(200000, txs, 2026, 11)).toBe(2370000);
  });

  it('handles zero budgets and negative balances safely without NaN or Infinity', () => {
    const budget = createDefaultBudgetConfig(DEFAULT_USER_ID, '2026-11');
    budget.plannedSalaryPaise = 0;
    budget.plannedFixedPayments = [];
    budget.categoryAllocationsPaise = { petrol: 0, food: 50000 };

    const txs: Transaction[] = [
      makeTx({ id: 'e1', type: 'expense', categoryId: 'petrol', amountPaise: 25000, date: '2026-11-30' }),
      makeTx({ id: 'e2', type: 'expense', categoryId: 'food', amountPaise: 75000, date: '2026-11-30' }),
    ];

    const summary = calculateMonthlySummary({
      year: 2026,
      month: 11,
      transactions: txs,
      categories: DEFAULT_CATEGORIES,
      budgetConfig: budget,
      referenceDateIST: '2026-11-30',
    });

    expect(summary.availableBalancePaise).toBe(-100000);
    expect(summary.isPersonalBudgetOverspent).toBe(true);
    expect(summary.dailySpendingAllowancePaise).toBe(0);
    expect(Number.isFinite(summary.personalBudgetUtilizationPct)).toBe(true);
    expect(getRemainingDaysInMonth(2026, 11, '2026-11-30')).toBe(1);

    const statuses = calculateCategoryBudgetStatuses(budget, txs, DEFAULT_CATEGORIES);
    const petrolStatus = statuses.find((s) => s.categoryId === 'petrol')!;
    const foodStatus = statuses.find((s) => s.categoryId === 'food')!;

    expect(petrolStatus.hasZeroBudget).toBe(true);
    expect(petrolStatus.utilizationPct).toBe(100);
    expect(petrolStatus.isOverspent).toBe(true);

    expect(foodStatus.allocatedPaise).toBe(50000);
    expect(foodStatus.remainingPaise).toBe(-25000);
    expect(foodStatus.utilizationPct).toBe(150);
    expect(foodStatus.isOverspent).toBe(true);
  });

  it('prevents duplicate EMI payments for the same installment', () => {
    const emi: EMIItem = {
      id: 'emi_1',
      userId: DEFAULT_USER_ID,
      name: 'AC EMI',
      categoryId: 'ac_emi',
      monthlyInstallmentPaise: 330000,
      totalInstallments: 12,
      totalLoanPaise: null,
      startDate: '2026-10-05',
      dueDay: 5,
      status: 'active',
      payments: [
        {
          id: 'p1',
          emiId: 'emi_1',
          installmentKey: '2026-10',
          installmentNumber: 1,
          amountPaise: 330000,
          paidDate: '2026-10-05',
          transactionId: 'tx_emi_oct',
        },
      ],
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-05T00:00:00.000Z',
    };

    const existingTxs = [
      makeTx({
        id: 'tx_emi_oct',
        categoryId: 'ac_emi',
        amountPaise: 330000,
        date: '2026-10-05',
        emiId: 'emi_1',
        emiInstallmentKey: '2026-10',
      }),
    ];

    expect(canRecordEMIPayment(emi, '2026-10', existingTxs).allowed).toBe(false);
    expect(canRecordEMIPayment(emi, '2026-11', existingTxs).allowed).toBe(true);
  });

  it('keeps savings transfers separate from expenses and computes yearly totals', () => {
    const txs: Transaction[] = [
      makeTx({ id: 't1', type: 'income', categoryId: 'salary', amountPaise: 1500000, date: '2026-10-01' }),
      makeTx({ id: 't2', type: 'expense', categoryId: 'food', amountPaise: 100000, date: '2026-10-05' }),
      makeTx({ id: 't3', type: 'income', categoryId: 'parent_support', amountPaise: 200000, date: '2026-11-05' }),
    ];

    const goals: SavingsGoal[] = [
      {
        id: 'g1',
        userId: DEFAULT_USER_ID,
        name: 'Emergency',
        targetPaise: 1000000,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ];
    const transfers: SavingsTransfer[] = [
      {
        id: 'st1',
        userId: DEFAULT_USER_ID,
        goalId: 'g1',
        type: 'deposit',
        amountPaise: 300000,
        date: '2026-10-20',
        createdAt: '2026-10-20T00:00:00Z',
      },
      {
        id: 'st2',
        userId: DEFAULT_USER_ID,
        goalId: 'g1',
        type: 'withdrawal',
        amountPaise: 50000,
        date: '2026-11-02',
        createdAt: '2026-11-02T00:00:00Z',
      },
    ];

    const savings = calculateSavingsSummary(goals, transfers);
    expect(savings.totalSavedPaise).toBe(250000);
    expect(savings.goals[0].remainingPaise).toBe(750000);

    const yearly = calculateYearlySummary(2026, txs, DEFAULT_CATEGORIES);
    // Savings transfers are not double-counted in expenses
    expect(yearly.totalIncomePaise).toBe(1700000);
    expect(yearly.totalExpensesPaise).toBe(100000);
    expect(yearly.totalParentSupportPaise).toBe(200000);
    expect(yearly.netCashFlowPaise).toBe(1600000);
  });
});
