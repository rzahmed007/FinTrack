import { generateId } from '@/lib/utils';
import type { IDataRepositorySet } from '@/repositories/interfaces';
import type { EMIItem, EMIPaymentRecord, Transaction } from '@/types/finance';
import { canRecordEMIPayment } from '@/utils/calculations';

export interface RecordEMIPaymentResult {
  emi: EMIItem;
  transaction: Transaction;
  payment: EMIPaymentRecord;
}

/**
 * Records a single EMI installment payment atomically:
 * 1. Prevents duplicate payment for the same installmentKey.
 * 2. Creates exactly one expense transaction linked via emiId & emiInstallmentKey.
 * 3. Updates EMI payment history & completion status.
 */
export async function recordEMIPayment(params: {
  repos: IDataRepositorySet;
  userId: string;
  emi: EMIItem;
  installmentKey: string;
  paidDate: string;
  existingTransactions: Transaction[];
  note?: string;
}): Promise<RecordEMIPaymentResult> {
  const {
    repos,
    userId,
    emi,
    installmentKey,
    paidDate,
    existingTransactions,
    note,
  } = params;

  const check = canRecordEMIPayment(emi, installmentKey, existingTransactions);
  if (!check.allowed) {
    throw new Error(check.reason ?? 'Cannot record duplicate EMI payment.');
  }

  const installmentNumber = emi.payments.length + 1;
  const transaction = await repos.transactions.create(userId, {
    type: 'expense',
    amountPaise: emi.monthlyInstallmentPaise,
    categoryId: emi.categoryId,
    date: paidDate,
    note: note?.trim() || `${emi.name} installment (${installmentKey})`,
    emiId: emi.id,
    emiInstallmentKey: installmentKey,
  });

  const payment: EMIPaymentRecord = {
    id: generateId('emipay'),
    emiId: emi.id,
    installmentKey,
    installmentNumber,
    amountPaise: emi.monthlyInstallmentPaise,
    paidDate,
    transactionId: transaction.id,
    note: note?.trim() || undefined,
  };

  const nextPayments = [...emi.payments, payment];
  const isCompleted =
    emi.totalInstallments !== null &&
    nextPayments.length >= emi.totalInstallments;

  const updatedEmi = await repos.emis.upsert(userId, {
    ...emi,
    payments: nextPayments,
    status: isCompleted ? 'completed' : emi.status,
  });

  return { emi: updatedEmi, transaction, payment };
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categoryNames: Map<string, string>,
): string {
  const headers = ['Date', 'Type', 'Category', 'Amount (INR)', 'Note'];
  const escapeCell = (val: string) => {
    const safe = val.replace(/"/g, '""');
    return `"${safe}"`;
  };

  const rows = transactions.map((tx) => [
    tx.date,
    tx.type === 'income' ? 'Income' : 'Expense',
    categoryNames.get(tx.categoryId) ?? tx.categoryId,
    (tx.amountPaise / 100).toFixed(2),
    tx.note ?? '',
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(String(cell))).join(','))
    .join('\n');
}
