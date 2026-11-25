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

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface IAuthRepository {
  getSession(): Promise<AuthSession | null>;
  signIn(credentials: SignInCredentials): Promise<AuthSession>;
  signOut(): Promise<void>;
  updateProfile(patch: Partial<UserProfile>): Promise<UserProfile>;
}

export interface CreateTransactionInput {
  type: Transaction['type'];
  amountPaise: number;
  categoryId: Transaction['categoryId'];
  date: string;
  note?: string;
  emiId?: string;
  emiInstallmentKey?: string;
}

export interface ITransactionRepository {
  list(userId: string): Promise<Transaction[]>;
  create(userId: string, input: CreateTransactionInput): Promise<Transaction>;
  update(
    userId: string,
    id: string,
    patch: Partial<CreateTransactionInput>,
  ): Promise<Transaction>;
  remove(userId: string, id: string): Promise<void>;
}

export interface IBudgetRepository {
  getBudgetConfig(userId: string, monthKey: string): Promise<BudgetConfig>;
  saveBudgetConfig(userId: string, config: BudgetConfig): Promise<BudgetConfig>;
  listCategories(userId: string): Promise<Category[]>;
  saveCategories(userId: string, categories: Category[]): Promise<Category[]>;
}

export interface IEMIRepository {
  list(userId: string): Promise<EMIItem[]>;
  upsert(userId: string, emi: EMIItem): Promise<EMIItem>;
  remove(userId: string, id: string): Promise<void>;
}

export interface ISavingsRepository {
  listGoals(userId: string): Promise<SavingsGoal[]>;
  upsertGoal(userId: string, goal: SavingsGoal): Promise<SavingsGoal>;
  removeGoal(userId: string, id: string): Promise<void>;
  listTransfers(userId: string): Promise<SavingsTransfer[]>;
  createTransfer(
    userId: string,
    transfer: Omit<SavingsTransfer, 'id' | 'userId' | 'createdAt'>,
  ): Promise<SavingsTransfer>;
}

export interface IDataRepositorySet {
  auth: IAuthRepository;
  transactions: ITransactionRepository;
  budgets: IBudgetRepository;
  emis: IEMIRepository;
  savings: ISavingsRepository;
  resetDemoData(): Promise<void>;
}
