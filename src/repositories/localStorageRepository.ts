import { DEFAULT_USER_ID, createDefaultBudgetConfig } from '@/data/defaults';
import { DEMO_USER, createDemoDataset } from '@/data/demoData';
import { generateId } from '@/lib/utils';
import type {
  CreateTransactionInput,
  IAuthRepository,
  IBudgetRepository,
  IDataRepositorySet,
  IEMIRepository,
  ISavingsRepository,
  ITransactionRepository,
  SignInCredentials,
} from '@/repositories/interfaces';
import type {
  AuthSession,
  BudgetConfig,
  Category,
  EMIItem,
  SavingsGoal,
  SavingsTransfer,
  Transaction,
  UserProfile,
} from '@/types/finance';

const DATA_STORAGE_KEY = 'fintrack_phase1_data_v1';
const SESSION_STORAGE_KEY = 'fintrack_phase1_session_v1';

interface StoredFinanceState {
  user: UserProfile;
  categories: Category[];
  budgetsByMonth: Record<string, BudgetConfig>;
  transactions: Transaction[];
  emis: EMIItem[];
  savingsGoals: SavingsGoal[];
  savingsTransfers: SavingsTransfer[];
}

function readState(): StoredFinanceState {
  try {
    const raw = localStorage.getItem(DATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredFinanceState;
      if (parsed && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }
  } catch {
    // Corrupted local state falls back to fresh demo data
  }
  const seeded = createDemoDataset();
  const initial: StoredFinanceState = {
    user: seeded.user,
    categories: seeded.categories,
    budgetsByMonth: {
      default: createDefaultBudgetConfig(seeded.user.id, 'default'),
      [seeded.budgetConfig.monthKey]: seeded.budgetConfig,
    },
    transactions: seeded.transactions,
    emis: seeded.emis,
    savingsGoals: seeded.savingsGoals,
    savingsTransfers: seeded.savingsTransfers,
  };
  writeState(initial);
  return initial;
}

function writeState(state: StoredFinanceState): void {
  localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(state));
}

class LocalStorageAuthRepository implements IAuthRepository {
  async getSession(): Promise<AuthSession | null> {
    try {
      const raw =
        localStorage.getItem(SESSION_STORAGE_KEY) ||
        sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    // Phase 1 demo authentication only — no real password storage or claims of cryptographic security.
    const state = readState();
    const user: UserProfile = {
      ...state.user,
      email: credentials.email.trim() || DEMO_USER.email,
    };
    state.user = user;
    writeState(state);

    const session: AuthSession = {
      user,
      isAuthenticated: true,
      rememberMe: credentials.rememberMe,
      signedInAt: new Date().toISOString(),
      mode: 'demo',
    };

    const serialized = JSON.stringify(session);
    if (credentials.rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    return session;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const state = readState();
    state.user = { ...state.user, ...patch };
    writeState(state);

    const existing = await this.getSession();
    if (existing) {
      const updatedSession: AuthSession = { ...existing, user: state.user };
      const serialized = JSON.stringify(updatedSession);
      if (existing.rememberMe) {
        localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      } else {
        sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
      }
    }

    return state.user;
  }
}

class LocalStorageTransactionRepository implements ITransactionRepository {
  async list(_userId: string): Promise<Transaction[]> {
    const state = readState();
    return [...state.transactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  async create(
    userId: string,
    input: CreateTransactionInput,
  ): Promise<Transaction> {
    const state = readState();
    const now = new Date().toISOString();
    const tx: Transaction = {
      id: generateId('tx'),
      userId: userId || DEFAULT_USER_ID,
      type: input.type,
      amountPaise: Math.max(0, Math.trunc(input.amountPaise)),
      categoryId: input.categoryId,
      date: input.date,
      note: input.note?.trim() || undefined,
      emiId: input.emiId,
      emiInstallmentKey: input.emiInstallmentKey,
      createdAt: now,
      updatedAt: now,
    };
    state.transactions = [tx, ...state.transactions];
    writeState(state);
    return tx;
  }

  async update(
    _userId: string,
    id: string,
    patch: Partial<CreateTransactionInput>,
  ): Promise<Transaction> {
    const state = readState();
    const idx = state.transactions.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new Error('Transaction not found.');
    }
    const existing = state.transactions[idx];
    const updated: Transaction = {
      ...existing,
      ...patch,
      amountPaise:
        patch.amountPaise !== undefined
          ? Math.max(0, Math.trunc(patch.amountPaise))
          : existing.amountPaise,
      note:
        patch.note !== undefined ? patch.note.trim() || undefined : existing.note,
      updatedAt: new Date().toISOString(),
    };
    state.transactions[idx] = updated;
    writeState(state);
    return updated;
  }

  async remove(_userId: string, id: string): Promise<void> {
    const state = readState();
    const target = state.transactions.find((t) => t.id === id);
    state.transactions = state.transactions.filter((t) => t.id !== id);

    // If a linked EMI transaction is deleted, keep EMI payment history consistent
    if (target?.emiId && target.emiInstallmentKey) {
      state.emis = state.emis.map((emi) => {
        if (emi.id !== target.emiId) return emi;
        const nextPayments = emi.payments.filter(
          (p) => p.transactionId !== target.id,
        );
        const isCompleted =
          emi.totalInstallments !== null &&
          nextPayments.length >= emi.totalInstallments;
        return {
          ...emi,
          payments: nextPayments,
          status: isCompleted ? 'completed' : 'active',
          updatedAt: new Date().toISOString(),
        };
      });
    }

    writeState(state);
  }
}

class LocalStorageBudgetRepository implements IBudgetRepository {
  async getBudgetConfig(userId: string, monthKey: string): Promise<BudgetConfig> {
    const state = readState();
    const exact = state.budgetsByMonth[monthKey];
    if (exact) return exact;

    const base =
      state.budgetsByMonth.default ?? createDefaultBudgetConfig(userId, 'default');
    return {
      ...base,
      id: `budget_${monthKey}`,
      monthKey,
    };
  }

  async saveBudgetConfig(
    _userId: string,
    config: BudgetConfig,
  ): Promise<BudgetConfig> {
    const state = readState();
    const updated: BudgetConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    state.budgetsByMonth[config.monthKey] = updated;
    // Also update default template so subsequent months inherit user's latest plan
    state.budgetsByMonth.default = {
      ...updated,
      id: 'budget_default',
      monthKey: 'default',
    };
    writeState(state);
    return updated;
  }

  async listCategories(_userId: string): Promise<Category[]> {
    const state = readState();
    return [...state.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async saveCategories(
    _userId: string,
    categories: Category[],
  ): Promise<Category[]> {
    const state = readState();
    state.categories = categories;
    writeState(state);
    return categories;
  }
}

class LocalStorageEMIRepository implements IEMIRepository {
  async list(_userId: string): Promise<EMIItem[]> {
    const state = readState();
    return state.emis;
  }

  async upsert(_userId: string, emi: EMIItem): Promise<EMIItem> {
    const state = readState();
    const idx = state.emis.findIndex((e) => e.id === emi.id);
    const updated: EMIItem = { ...emi, updatedAt: new Date().toISOString() };
    if (idx === -1) {
      state.emis = [...state.emis, updated];
    } else {
      state.emis[idx] = updated;
    }
    writeState(state);
    return updated;
  }

  async remove(_userId: string, id: string): Promise<void> {
    const state = readState();
    state.emis = state.emis.filter((e) => e.id !== id);
    writeState(state);
  }
}

class LocalStorageSavingsRepository implements ISavingsRepository {
  async listGoals(_userId: string): Promise<SavingsGoal[]> {
    const state = readState();
    return state.savingsGoals;
  }

  async upsertGoal(_userId: string, goal: SavingsGoal): Promise<SavingsGoal> {
    const state = readState();
    const idx = state.savingsGoals.findIndex((g) => g.id === goal.id);
    const updated: SavingsGoal = { ...goal, updatedAt: new Date().toISOString() };
    if (idx === -1) {
      state.savingsGoals = [...state.savingsGoals, updated];
    } else {
      state.savingsGoals[idx] = updated;
    }
    writeState(state);
    return updated;
  }

  async removeGoal(_userId: string, id: string): Promise<void> {
    const state = readState();
    state.savingsGoals = state.savingsGoals.filter((g) => g.id !== id);
    state.savingsTransfers = state.savingsTransfers.filter((t) => t.goalId !== id);
    writeState(state);
  }

  async listTransfers(_userId: string): Promise<SavingsTransfer[]> {
    const state = readState();
    return [...state.savingsTransfers].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }

  async createTransfer(
    userId: string,
    transfer: Omit<SavingsTransfer, 'id' | 'userId' | 'createdAt'>,
  ): Promise<SavingsTransfer> {
    const state = readState();
    const item: SavingsTransfer = {
      ...transfer,
      id: generateId('st'),
      userId: userId || DEFAULT_USER_ID,
      amountPaise: Math.max(0, Math.trunc(transfer.amountPaise)),
      createdAt: new Date().toISOString(),
    };
    state.savingsTransfers = [item, ...state.savingsTransfers];
    writeState(state);
    return item;
  }
}

export function createLocalStorageRepositories(): IDataRepositorySet {
  return {
    auth: new LocalStorageAuthRepository(),
    transactions: new LocalStorageTransactionRepository(),
    budgets: new LocalStorageBudgetRepository(),
    emis: new LocalStorageEMIRepository(),
    savings: new LocalStorageSavingsRepository(),
    async resetDemoData() {
      localStorage.removeItem(DATA_STORAGE_KEY);
      readState();
    },
  };
}
