import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_USER_ID,
  createEmptyBudgetConfig,
} from '@/data/defaults';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { CreateTransactionInput } from '@/repositories/interfaces';
import { getActiveRepositories } from '@/repositories/supabaseRepository';
import { recordEMIPayment } from '@/services/financeService';
import type {
  BudgetConfig,
  Category,
  CategoryId,
  EMIItem,
  MonthYear,
  SavingsGoal,
  SavingsTransfer,
  Transaction,
  TransactionType,
} from '@/types/finance';
import {
  type CategoryBreakdownItem,
  type CategoryBudgetStatus,
  type MonthlyFinancialSummary,
  type TotalSavingsSummary,
  type YearlyFinancialSummary,
  calculateCategoryBudgetStatuses,
  calculateDailySpendingSeries,
  calculateExpenseBreakdown,
  calculateMonthlySummary,
  calculateSavingsSummary,
  calculateYearlySummary,
} from '@/utils/calculations';
import {
  getCurrentMonthYearIST,
  getMonthKeyFromDate,
  getTodayIST,
  toMonthKey,
} from '@/utils/date';

export interface QuickAddPreset {
  type?: TransactionType;
  categoryId?: CategoryId;
  editingTransaction?: Transaction | null;
}

interface FinanceContextValue {
  isLoading: boolean;
  selectedMonthYear: MonthYear;
  setSelectedMonthYear: React.Dispatch<React.SetStateAction<MonthYear>>;
  hideBalances: boolean;
  toggleHideBalances: () => void;

  // Raw data
  transactions: Transaction[];
  monthTransactions: Transaction[];
  categories: Category[];
  budgetConfig: BudgetConfig;
  emis: EMIItem[];
  savingsGoals: SavingsGoal[];
  savingsTransfers: SavingsTransfer[];

  // Derived calculations
  summary: MonthlyFinancialSummary;
  yearlySummary: YearlyFinancialSummary;
  expenseBreakdown: CategoryBreakdownItem[];
  categoryBudgetStatuses: CategoryBudgetStatus[];
  dailySpendingSeries: Array<{
    day: number;
    label: string;
    expensePaise: number;
    incomePaise: number;
  }>;
  savingsSummary: TotalSavingsSummary;

  // Quick add modal / bottom-sheet controls
  quickAddOpen: boolean;
  quickAddPreset: QuickAddPreset;
  openQuickAdd: (preset?: QuickAddPreset) => void;
  closeQuickAdd: () => void;

  // Mutations
  addTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  editTransaction: (
    id: string,
    patch: Partial<CreateTransactionInput>,
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudgetConfig: (config: BudgetConfig) => Promise<BudgetConfig>;
  saveCategories: (categories: Category[]) => Promise<Category[]>;
  payEMIInstallment: (params: {
    emi: EMIItem;
    installmentKey: string;
    paidDate: string;
    note?: string;
  }) => Promise<void>;
  upsertEMI: (emi: EMIItem) => Promise<EMIItem>;
  deleteEMI: (id: string) => Promise<void>;
  upsertSavingsGoal: (goal: SavingsGoal) => Promise<SavingsGoal>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addSavingsTransfer: (
    transfer: Omit<SavingsTransfer, 'id' | 'userId' | 'createdAt'>,
  ) => Promise<SavingsTransfer>;
  clearAllData: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const HIDE_BALANCE_KEY = 'fintrack_hide_balances_v1';

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const repos = useMemo(() => getActiveRepositories(), []);
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id ?? DEFAULT_USER_ID;

  const [selectedMonthYear, setSelectedMonthYear] = useState<MonthYear>(() =>
    getCurrentMonthYearIST(),
  );
  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HIDE_BALANCE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(() =>
    createEmptyBudgetConfig(DEFAULT_USER_ID),
  );
  const [emis, setEmis] = useState<EMIItem[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsTransfers, setSavingsTransfers] = useState<SavingsTransfer[]>([]);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddPreset, setQuickAddPreset] = useState<QuickAddPreset>({});

  const monthKey = toMonthKey(selectedMonthYear.year, selectedMonthYear.month);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txList, catList, budget, emiList, goalList, transferList] =
        await Promise.all([
          repos.transactions.list(userId),
          repos.budgets.listCategories(userId),
          repos.budgets.getBudgetConfig(userId, monthKey),
          repos.emis.list(userId),
          repos.savings.listGoals(userId),
          repos.savings.listTransfers(userId),
        ]);
      setTransactions(txList);
      setCategories(catList);
      setBudgetConfig(budget);
      setEmis(emiList);
      setSavingsGoals(goalList);
      setSavingsTransfers(transferList);
    } finally {
      setIsLoading(false);
    }
  }, [repos, userId, monthKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let active = true;
    Promise.all([
      repos.transactions.list(userId),
      repos.budgets.listCategories(userId),
      repos.budgets.getBudgetConfig(userId, monthKey),
      repos.emis.list(userId),
      repos.savings.listGoals(userId),
      repos.savings.listTransfers(userId),
    ])
      .then(([txList, catList, budget, emiList, goalList, transferList]) => {
        if (!active) return;
        setTransactions(txList);
        setCategories(catList);
        setBudgetConfig(budget);
        setEmis(emiList);
        setSavingsGoals(goalList);
        setSavingsTransfers(transferList);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, repos, userId, monthKey]);

  const toggleHideBalances = useCallback(() => {
    setHideBalances((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(HIDE_BALANCE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const openQuickAdd = useCallback((preset: QuickAddPreset = {}) => {
    setQuickAddPreset(preset);
    setQuickAddOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setQuickAddOpen(false);
    setQuickAddPreset({});
  }, []);

  const addTransaction = useCallback(
    async (input: CreateTransactionInput) => {
      const created = await repos.transactions.create(userId, input);
      setTransactions((prev) =>
        [created, ...prev].sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt.localeCompare(a.createdAt);
        }),
      );
      showToast({
        variant: 'success',
        title:
          input.type === 'income' ? 'Income recorded' : 'Expense recorded',
        description: 'Balances and budgets updated.',
      });
      return created;
    },
    [repos, userId, showToast],
  );

  const editTransaction = useCallback(
    async (id: string, patch: Partial<CreateTransactionInput>) => {
      const updated = await repos.transactions.update(userId, id, patch);
      setTransactions((prev) =>
        prev
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return b.createdAt.localeCompare(a.createdAt);
          }),
      );
      showToast({
        variant: 'success',
        title: 'Transaction updated',
      });
      return updated;
    },
    [repos, userId, showToast],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await repos.transactions.remove(userId, id);
      const [txList, emiList] = await Promise.all([
        repos.transactions.list(userId),
        repos.emis.list(userId),
      ]);
      setTransactions(txList);
      setEmis(emiList);
      showToast({
        variant: 'info',
        title: 'Transaction deleted',
      });
    },
    [repos, userId, showToast],
  );

  const saveBudgetConfig = useCallback(
    async (config: BudgetConfig) => {
      const saved = await repos.budgets.saveBudgetConfig(userId, config);
      setBudgetConfig(saved);
      showToast({
        variant: 'success',
        title: 'Budget configuration saved',
      });
      return saved;
    },
    [repos, userId, showToast],
  );

  const saveCategories = useCallback(
    async (next: Category[]) => {
      const saved = await repos.budgets.saveCategories(userId, next);
      setCategories(saved);
      showToast({
        variant: 'success',
        title: 'Categories updated',
      });
      return saved;
    },
    [repos, userId, showToast],
  );

  const payEMIInstallment = useCallback(
    async (params: {
      emi: EMIItem;
      installmentKey: string;
      paidDate: string;
      note?: string;
    }) => {
      const result = await recordEMIPayment({
        repos,
        userId,
        emi: params.emi,
        installmentKey: params.installmentKey,
        paidDate: params.paidDate,
        existingTransactions: transactions,
        note: params.note,
      });

      setEmis((prev) =>
        prev.map((item) => (item.id === result.emi.id ? result.emi : item)),
      );
      setTransactions((prev) =>
        [result.transaction, ...prev].sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt.localeCompare(a.createdAt);
        }),
      );
      showToast({
        variant: 'success',
        title: `${params.emi.name} marked as paid`,
        description: `Created 1 expense transaction for ${params.installmentKey}.`,
      });
    },
    [repos, userId, transactions, showToast],
  );

  const upsertEMI = useCallback(
    async (emi: EMIItem) => {
      const saved = await repos.emis.upsert(userId, emi);
      setEmis((prev) => {
        const exists = prev.some((e) => e.id === saved.id);
        return exists
          ? prev.map((e) => (e.id === saved.id ? saved : e))
          : [...prev, saved];
      });
      showToast({ variant: 'success', title: 'EMI schedule saved' });
      return saved;
    },
    [repos, userId, showToast],
  );

  const deleteEMI = useCallback(
    async (id: string) => {
      await repos.emis.remove(userId, id);
      setEmis((prev) => prev.filter((e) => e.id !== id));
      showToast({ variant: 'info', title: 'EMI removed' });
    },
    [repos, userId, showToast],
  );

  const upsertSavingsGoal = useCallback(
    async (goal: SavingsGoal) => {
      const saved = await repos.savings.upsertGoal(userId, goal);
      setSavingsGoals((prev) => {
        const exists = prev.some((g) => g.id === saved.id);
        return exists
          ? prev.map((g) => (g.id === saved.id ? saved : g))
          : [...prev, saved];
      });
      showToast({ variant: 'success', title: 'Savings goal saved' });
      return saved;
    },
    [repos, userId, showToast],
  );

  const deleteSavingsGoal = useCallback(
    async (id: string) => {
      await repos.savings.removeGoal(userId, id);
      setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
      setSavingsTransfers((prev) => prev.filter((t) => t.goalId !== id));
      showToast({ variant: 'info', title: 'Savings goal deleted' });
    },
    [repos, userId, showToast],
  );

  const addSavingsTransfer = useCallback(
    async (transfer: Omit<SavingsTransfer, 'id' | 'userId' | 'createdAt'>) => {
      const saved = await repos.savings.createTransfer(userId, transfer);
      setSavingsTransfers((prev) => [saved, ...prev]);
      showToast({
        variant: 'success',
        title:
          transfer.type === 'deposit'
            ? 'Savings added'
            : 'Savings withdrawn',
        description: 'Tracked separately from monthly expenses.',
      });
      return saved;
    },
    [repos, userId, showToast],
  );

  const clearAllData = useCallback(async () => {
    await repos.clearAllData();
    await refreshAll();
    showToast({
      variant: 'success',
      title: 'Local data cleared',
      description: 'All transactions, budgets, EMIs and savings goals reset to empty.',
    });
  }, [repos, refreshAll, showToast]);

  const monthTransactions = useMemo(
    () =>
      transactions.filter((tx) => getMonthKeyFromDate(tx.date) === monthKey),
    [transactions, monthKey],
  );

  const summary = useMemo(
    () =>
      calculateMonthlySummary({
        year: selectedMonthYear.year,
        month: selectedMonthYear.month,
        transactions,
        categories,
        budgetConfig,
        initialOpeningBalancePaise: user?.initialOpeningBalancePaise ?? 0,
        referenceDateIST: getTodayIST(),
      }),
    [
      selectedMonthYear.year,
      selectedMonthYear.month,
      transactions,
      categories,
      budgetConfig,
      user?.initialOpeningBalancePaise,
    ],
  );

  const yearlySummary = useMemo(
    () =>
      calculateYearlySummary(selectedMonthYear.year, transactions, categories),
    [selectedMonthYear.year, transactions, categories],
  );

  const expenseBreakdown = useMemo(
    () => calculateExpenseBreakdown(monthTransactions, categories),
    [monthTransactions, categories],
  );

  const categoryBudgetStatuses = useMemo(
    () =>
      calculateCategoryBudgetStatuses(
        budgetConfig,
        monthTransactions,
        categories,
      ),
    [budgetConfig, monthTransactions, categories],
  );

  const dailySpendingSeries = useMemo(
    () =>
      calculateDailySpendingSeries(
        selectedMonthYear.year,
        selectedMonthYear.month,
        transactions,
      ),
    [selectedMonthYear.year, selectedMonthYear.month, transactions],
  );

  const savingsSummary = useMemo(
    () => calculateSavingsSummary(savingsGoals, savingsTransfers),
    [savingsGoals, savingsTransfers],
  );

  return (
    <FinanceContext.Provider
      value={{
        isLoading,
        selectedMonthYear,
        setSelectedMonthYear,
        hideBalances,
        toggleHideBalances,
        transactions,
        monthTransactions,
        categories,
        budgetConfig,
        emis,
        savingsGoals,
        savingsTransfers,
        summary,
        yearlySummary,
        expenseBreakdown,
        categoryBudgetStatuses,
        dailySpendingSeries,
        savingsSummary,
        quickAddOpen,
        quickAddPreset,
        openQuickAdd,
        closeQuickAdd,
        addTransaction,
        editTransaction,
        deleteTransaction,
        saveBudgetConfig,
        saveCategories,
        payEMIInstallment,
        upsertEMI,
        deleteEMI,
        upsertSavingsGoal,
        deleteSavingsGoal,
        addSavingsTransfer,
        clearAllData,
        refreshAll,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
