import {
  DEFAULT_CATEGORIES,
  DEFAULT_USER_ID,
  createDefaultBudgetConfig,
} from '@/data/defaults';
import type {
  BudgetConfig,
  Category,
  EMIItem,
  SavingsGoal,
  SavingsTransfer,
  Transaction,
  UserProfile,
} from '@/types/finance';
import {
  addMonthsToMonthYear,
  getCurrentMonthYearIST,
  getDaysInMonth,
  getTodayIST,
  toMonthKey,
} from '@/utils/date';

export interface DemoDataset {
  user: UserProfile;
  categories: Category[];
  budgetConfig: BudgetConfig;
  transactions: Transaction[];
  emis: EMIItem[];
  savingsGoals: SavingsGoal[];
  savingsTransfers: SavingsTransfer[];
}

export const DEMO_USER: UserProfile = {
  id: DEFAULT_USER_ID,
  name: 'Ahmed Raza',
  email: 'ahmed@fintrack.demo',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  initialOpeningBalancePaise: 240000, // ₹2,400 initial carried balance before demo months
  isDemoUser: true,
};

function clampDate(year: number, month: number, day: number): string {
  const maxDay = getDaysInMonth(year, month);
  return `${toMonthKey(year, month)}-${String(Math.min(day, maxDay)).padStart(2, '0')}`;
}

export function createDemoDataset(): DemoDataset {
  const current = getCurrentMonthYearIST();
  const prev1 = addMonthsToMonthYear(current, -1);
  const prev2 = addMonthsToMonthYear(current, -2);
  const todayIST = getTodayIST();
  const todayDay = parseInt(todayIST.slice(8, 10), 10);

  const p2Key = toMonthKey(prev2.year, prev2.month);
  const p1Key = toMonthKey(prev1.year, prev1.month);
  const curKey = toMonthKey(current.year, current.month);
  const nowIso = new Date().toISOString();

  const emiId = 'emi_ac_1';
  const txEmiP2Id = 'tx_demo_emi_p2';
  const txEmiP1Id = 'tx_demo_emi_p1';

  const transactions: Transaction[] = [
    // Two months ago
    {
      id: 'tx_demo_p2_salary',
      userId: DEFAULT_USER_ID,
      type: 'income',
      amountPaise: 1500000,
      categoryId: 'salary',
      date: clampDate(prev2.year, prev2.month, 1),
      note: 'Monthly salary credited',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p2_parents',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 500000,
      categoryId: 'parents',
      date: clampDate(prev2.year, prev2.month, 3),
      note: 'Monthly home support',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: txEmiP2Id,
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 330000,
      categoryId: 'ac_emi',
      date: clampDate(prev2.year, prev2.month, 5),
      note: `AC EMI installment (${p2Key})`,
      emiId,
      emiInstallmentKey: p2Key,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p2_madrasa',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 160000,
      categoryId: 'brother_madrasa',
      date: clampDate(prev2.year, prev2.month, 7),
      note: "Brother's Madrasa monthly fee",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p2_dad',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 200000,
      categoryId: 'dad',
      date: clampDate(prev2.year, prev2.month, 10),
      note: 'Additional payment to Dad',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p2_petrol',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 78000,
      categoryId: 'petrol',
      date: clampDate(prev2.year, prev2.month, 12),
      note: 'Commute fuel',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p2_food',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 96000,
      categoryId: 'food',
      date: clampDate(prev2.year, prev2.month, 18),
      note: 'Tiffin and snacks',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p2_recharge',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 29900,
      categoryId: 'mobile_recharge',
      date: clampDate(prev2.year, prev2.month, 21),
      note: '28-day mobile pack',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // Last month
    {
      id: 'tx_demo_p1_salary',
      userId: DEFAULT_USER_ID,
      type: 'income',
      amountPaise: 1500000,
      categoryId: 'salary',
      date: clampDate(prev1.year, prev1.month, 1),
      note: 'Monthly salary credited',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p1_parent_support',
      userId: DEFAULT_USER_ID,
      type: 'income',
      amountPaise: 150000,
      categoryId: 'parent_support',
      date: clampDate(prev1.year, prev1.month, 14),
      note: 'Extra from Parents for travel',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p1_parents',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 500000,
      categoryId: 'parents',
      date: clampDate(prev1.year, prev1.month, 3),
      note: 'Monthly home support',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: txEmiP1Id,
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 330000,
      categoryId: 'ac_emi',
      date: clampDate(prev1.year, prev1.month, 5),
      note: `AC EMI installment (${p1Key})`,
      emiId,
      emiInstallmentKey: p1Key,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p1_madrasa',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 160000,
      categoryId: 'brother_madrasa',
      date: clampDate(prev1.year, prev1.month, 7),
      note: "Brother's Madrasa fee",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p1_dad',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 200000,
      categoryId: 'dad',
      date: clampDate(prev1.year, prev1.month, 10),
      note: 'Additional payment to Dad',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p1_petrol',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 85000,
      categoryId: 'petrol',
      date: clampDate(prev1.year, prev1.month, 11),
      note: 'Full tank petrol',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p1_food',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 124000,
      categoryId: 'food',
      date: clampDate(prev1.year, prev1.month, 19),
      note: 'Groceries & meals',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p1_games',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 35000,
      categoryId: 'games',
      date: clampDate(prev1.year, prev1.month, 22),
      note: 'Game pass & store credit',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_p1_medical',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 42000,
      categoryId: 'medical',
      date: clampDate(prev1.year, prev1.month, 25),
      note: 'Pharmacy essentials',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // Current month
    {
      id: 'tx_demo_cur_salary',
      userId: DEFAULT_USER_ID,
      type: 'income',
      amountPaise: 1500000,
      categoryId: 'salary',
      date: clampDate(current.year, current.month, 1),
      note: 'November salary credited',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_parents',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 500000,
      categoryId: 'parents',
      date: clampDate(current.year, current.month, Math.min(3, todayDay)),
      note: 'Monthly support to Parents',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_madrasa',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 160000,
      categoryId: 'brother_madrasa',
      date: clampDate(current.year, current.month, Math.min(7, todayDay)),
      note: "Brother's Madrasa tuition",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_parent_extra',
      userId: DEFAULT_USER_ID,
      type: 'income',
      amountPaise: 200000,
      categoryId: 'parent_support',
      date: clampDate(current.year, current.month, Math.min(9, todayDay)),
      note: 'Extra from Parents (winter clothes)',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_petrol_1',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 45000,
      categoryId: 'petrol',
      date: clampDate(current.year, current.month, Math.min(6, todayDay)),
      note: 'Bike petrol refill',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_food_1',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 42000,
      categoryId: 'food',
      date: clampDate(current.year, current.month, Math.min(11, todayDay)),
      note: 'Lunch & tea with team',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_recharge',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 29900,
      categoryId: 'mobile_recharge',
      date: clampDate(current.year, current.month, Math.min(14, todayDay)),
      note: 'Monthly mobile recharge',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_games',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 19900,
      categoryId: 'games',
      date: clampDate(current.year, current.month, Math.min(16, todayDay)),
      note: 'Weekend gaming top-up',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_petrol_2',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 32000,
      categoryId: 'petrol',
      date: clampDate(current.year, current.month, Math.max(1, todayDay - 2)),
      note: 'Fuel top-up',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tx_demo_cur_food_2',
      userId: DEFAULT_USER_ID,
      type: 'expense',
      amountPaise: 28000,
      categoryId: 'food',
      date: todayIST,
      note: 'Dinner & coffee',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  // Note: AC EMI for current month (curKey) and Dad (₹2,000) are intentionally left pending
  // so Upcoming Fixed Payments and one-click Mark as Paid are demonstrable immediately.
  const emis: EMIItem[] = [
    {
      id: emiId,
      userId: DEFAULT_USER_ID,
      name: 'AC EMI',
      categoryId: 'ac_emi',
      monthlyInstallmentPaise: 330000, // ₹3,300
      totalInstallments: null, // User-configurable (not invented)
      totalLoanPaise: null, // User-configurable (not invented)
      startDate: clampDate(prev2.year, prev2.month, 5),
      dueDay: 5,
      status: 'active',
      payments: [
        {
          id: 'emipay_p2',
          emiId,
          installmentKey: p2Key,
          installmentNumber: 1,
          amountPaise: 330000,
          paidDate: clampDate(prev2.year, prev2.month, 5),
          transactionId: txEmiP2Id,
          note: 'Paid on schedule',
        },
        {
          id: 'emipay_p1',
          emiId,
          installmentKey: p1Key,
          installmentNumber: 2,
          amountPaise: 330000,
          paidDate: clampDate(prev1.year, prev1.month, 5),
          transactionId: txEmiP1Id,
          note: 'Paid on schedule',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const savingsGoals: SavingsGoal[] = [
    {
      id: 'goal_emergency',
      userId: DEFAULT_USER_ID,
      name: 'Emergency Reserve',
      targetPaise: 2500000, // ₹25,000
      targetDate: `${current.year + 1}-06-30`,
      note: '3-month personal safety buffer',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'goal_laptop',
      userId: DEFAULT_USER_ID,
      name: 'Workstation Upgrade',
      targetPaise: 4500000, // ₹45,000
      targetDate: `${current.year + 1}-10-01`,
      note: 'Dedicated laptop fund',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const savingsTransfers: SavingsTransfer[] = [
    {
      id: 'st_1',
      userId: DEFAULT_USER_ID,
      goalId: 'goal_emergency',
      type: 'deposit',
      amountPaise: 200000,
      date: clampDate(prev2.year, prev2.month, 28),
      note: 'Month-end surplus transfer',
      createdAt: nowIso,
    },
    {
      id: 'st_2',
      userId: DEFAULT_USER_ID,
      goalId: 'goal_emergency',
      type: 'deposit',
      amountPaise: 150000,
      date: clampDate(prev1.year, prev1.month, 29),
      note: 'Monthly reserve transfer',
      createdAt: nowIso,
    },
    {
      id: 'st_3',
      userId: DEFAULT_USER_ID,
      goalId: 'goal_laptop',
      type: 'deposit',
      amountPaise: 100000,
      date: clampDate(current.year, current.month, Math.min(12, todayDay)),
      note: 'Initial laptop allocation',
      createdAt: nowIso,
    },
  ];

  return {
    user: DEMO_USER,
    categories: DEFAULT_CATEGORIES,
    budgetConfig: createDefaultBudgetConfig(DEFAULT_USER_ID, curKey),
    transactions,
    emis,
    savingsGoals,
    savingsTransfers,
  };
}
