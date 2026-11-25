export type TransactionType = 'income' | 'expense';

export type ExpenseGroup = 'fixed' | 'variable';

export type DefaultIncomeCategoryId =
  | 'salary'
  | 'parent_support'
  | 'freelance'
  | 'other_income';

export type DefaultExpenseCategoryId =
  | 'ac_emi'
  | 'parents'
  | 'dad'
  | 'brother_madrasa'
  | 'petrol'
  | 'food'
  | 'games'
  | 'mobile_recharge'
  | 'shopping'
  | 'medical'
  | 'other_expenses';

export type CategoryId =
  | DefaultIncomeCategoryId
  | DefaultExpenseCategoryId
  | (string & {});

export interface Category {
  id: CategoryId;
  name: string;
  type: TransactionType;
  expenseGroup?: ExpenseGroup;
  icon: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  /** Integer paise (1 INR = 100 paise) */
  amountPaise: number;
  categoryId: CategoryId;
  /** Date string YYYY-MM-DD in Asia/Kolkata */
  date: string;
  note?: string;
  /** Optional link to an EMI installment payment to enforce idempotency */
  emiId?: string;
  emiInstallmentKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannedFixedPayment {
  id: string;
  categoryId: CategoryId;
  label: string;
  amountPaise: number;
  dueDay: number;
  active: boolean;
}

export interface BudgetConfig {
  id: string;
  userId: string;
  /** Year-month key e.g. '2026-11' or 'default' */
  monthKey: string;
  plannedSalaryPaise: number;
  plannedFixedPayments: PlannedFixedPayment[];
  /** Personal category allocations in paise keyed by CategoryId */
  categoryAllocationsPaise: Record<string, number>;
  updatedAt: string;
}

export type EMIStatus = 'active' | 'completed' | 'paused';

export interface EMIPaymentRecord {
  id: string;
  emiId: string;
  /** Unique installment period key, e.g. '2026-11' or 'inst-5' */
  installmentKey: string;
  installmentNumber: number;
  amountPaise: number;
  paidDate: string;
  transactionId: string;
  note?: string;
}

export interface EMIItem {
  id: string;
  userId: string;
  name: string;
  categoryId: CategoryId;
  monthlyInstallmentPaise: number;
  /** Configurable; null when user hasn't specified loan tenure yet */
  totalInstallments: number | null;
  /** Configurable; null when user hasn't specified total loan amount yet */
  totalLoanPaise: number | null;
  startDate: string;
  dueDay: number;
  status: EMIStatus;
  payments: EMIPaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetPaise: number;
  targetDate?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type SavingsTransferType = 'deposit' | 'withdrawal';

export interface SavingsTransfer {
  id: string;
  userId: string;
  goalId: string;
  type: SavingsTransferType;
  amountPaise: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: 'INR';
  timezone: 'Asia/Kolkata';
  initialOpeningBalancePaise: number;
  isDemoUser: boolean;
}

export interface AuthSession {
  user: UserProfile;
  isAuthenticated: boolean;
  rememberMe: boolean;
  signedInAt: string;
  mode: 'demo' | 'supabase';
}

export type ThemeMode = 'light' | 'dark';

export interface MonthYear {
  year: number;
  /** 1-12 */
  month: number;
}
