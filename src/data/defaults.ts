import type { BudgetConfig, Category } from '@/types/finance';

export const DEFAULT_USER_ID = 'local-user';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  {
    id: 'salary',
    name: 'Salary',
    type: 'income',
    icon: 'Briefcase',
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'parent_support',
    name: 'Extra from Parents',
    type: 'income',
    icon: 'HeartHandshake',
    isDefault: true,
    sortOrder: 2,
  },
  {
    id: 'freelance',
    name: 'Freelance Income',
    type: 'income',
    icon: 'Laptop',
    isDefault: true,
    sortOrder: 3,
  },
  {
    id: 'other_income',
    name: 'Other Income',
    type: 'income',
    icon: 'PlusCircle',
    isDefault: true,
    sortOrder: 4,
  },

  // Fixed Expense categories
  {
    id: 'ac_emi',
    name: 'AC EMI',
    type: 'expense',
    expenseGroup: 'fixed',
    icon: 'Wind',
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'parents',
    name: 'Parents',
    type: 'expense',
    expenseGroup: 'fixed',
    icon: 'Users',
    isDefault: true,
    sortOrder: 2,
  },
  {
    id: 'dad',
    name: 'Dad',
    type: 'expense',
    expenseGroup: 'fixed',
    icon: 'UserCheck',
    isDefault: true,
    sortOrder: 3,
  },
  {
    id: 'brother_madrasa',
    name: "Brother's Madrasa",
    type: 'expense',
    expenseGroup: 'fixed',
    icon: 'BookOpen',
    isDefault: true,
    sortOrder: 4,
  },

  // Variable / Personal Expense categories
  {
    id: 'petrol',
    name: 'Petrol',
    type: 'expense',
    expenseGroup: 'variable',
    icon: 'Fuel',
    isDefault: true,
    sortOrder: 5,
  },
  {
    id: 'food',
    name: 'Food',
    type: 'expense',
    expenseGroup: 'variable',
    icon: 'Utensils',
    isDefault: true,
    sortOrder: 6,
  },
  {
    id: 'games',
    name: 'Games',
    type: 'expense',
    expenseGroup: 'variable',
    icon: 'Gamepad2',
    isDefault: true,
    sortOrder: 7,
  },
  {
    id: 'mobile_recharge',
    name: 'Mobile Recharge',
    type: 'expense',
    expenseGroup: 'variable',
    icon: 'Smartphone',
    isDefault: true,
    sortOrder: 8,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    type: 'expense',
    expenseGroup: 'variable',
    icon: 'ShoppingBag',
    isDefault: true,
    sortOrder: 9,
  },
  {
    id: 'medical',
    name: 'Medical',
    type: 'expense',
    expenseGroup: 'variable',
    icon: 'Stethoscope',
    isDefault: true,
    sortOrder: 10,
  },
  {
    id: 'other_expenses',
    name: 'Other Expenses',
    type: 'expense',
    expenseGroup: 'variable',
    icon: 'Receipt',
    isDefault: true,
    sortOrder: 11,
  },
];

export function createEmptyBudgetConfig(
  userId: string = DEFAULT_USER_ID,
  monthKey = 'default',
): BudgetConfig {
  return {
    id: `budget_${monthKey}`,
    userId,
    monthKey,
    plannedSalaryPaise: 0,
    plannedFixedPayments: [],
    categoryAllocationsPaise: {},
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultBudgetConfig(
  userId: string = DEFAULT_USER_ID,
  monthKey = 'default',
): BudgetConfig {
  return {
    id: `budget_${monthKey}`,
    userId,
    monthKey,
    plannedSalaryPaise: 1500000, // ₹15,000
    plannedFixedPayments: [
      {
        id: 'fp_ac_emi',
        categoryId: 'ac_emi',
        label: 'AC EMI',
        amountPaise: 330000, // ₹3,300
        dueDay: 5,
        active: true,
      },
      {
        id: 'fp_parents',
        categoryId: 'parents',
        label: 'Parents',
        amountPaise: 500000, // ₹5,000
        dueDay: 3,
        active: true,
      },
      {
        id: 'fp_brother_madrasa',
        categoryId: 'brother_madrasa',
        label: "Brother's Madrasa",
        amountPaise: 160000, // ₹1,600
        dueDay: 7,
        active: true,
      },
      {
        id: 'fp_dad',
        categoryId: 'dad',
        label: 'Additional payment to Dad',
        amountPaise: 200000, // ₹2,000
        dueDay: 10,
        active: true,
      },
    ],
    categoryAllocationsPaise: {
      petrol: 90000,
      food: 110000,
      games: 30000,
      mobile_recharge: 30000,
      shopping: 25000,
      medical: 15000,
      other_expenses: 10000,
    },
    updatedAt: new Date().toISOString(),
  };
}
