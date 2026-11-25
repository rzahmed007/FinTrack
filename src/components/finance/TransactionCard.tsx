import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { cn } from '@/lib/utils';
import type { Category, Transaction } from '@/types/finance';
import { formatINR } from '@/utils/currency';
import { formatDateDisplay } from '@/utils/date';

export interface TransactionCardProps {
  transaction: Transaction;
  category?: Category;
  hideBalances?: boolean;
  showDate?: boolean;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

export function TransactionCard({
  transaction,
  category,
  hideBalances = false,
  showDate = false,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = transaction.type === 'income';
  const isParentSupport = transaction.categoryId === 'parent_support';
  const isFixedExpense =
    !isIncome && category?.expenseGroup === 'fixed';

  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-surface-hover/60">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
            isIncome
              ? 'border-foreground bg-primary text-primary-foreground'
              : 'border-border bg-surface-secondary text-foreground',
          )}
        >
          <CategoryIcon icon={category?.icon} className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-bold text-foreground">
              {category?.name ?? transaction.categoryId}
            </span>
            {isParentSupport && (
              <Badge variant="outline">Parent Support</Badge>
            )}
            {isFixedExpense && <Badge variant="default">Fixed</Badge>}
            {transaction.emiId && <Badge variant="striped">EMI</Badge>}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {showDate && (
              <span className="tabular-nums">
                {formatDateDisplay(transaction.date, 'short')}
              </span>
            )}
            {transaction.note ? (
              <span className="truncate max-w-[200px] sm:max-w-[320px]">
                {transaction.note}
              </span>
            ) : (
              <span>{isIncome ? 'Income entry' : 'Expense entry'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-sm sm:text-base font-bold text-foreground tabular-nums">
            {isIncome ? (
              <ArrowDownLeft
                className="h-3.5 w-3.5 shrink-0"
                aria-label="Income"
              />
            ) : (
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-label="Expense"
              />
            )}
            <span>
              {formatINR(
                isIncome ? transaction.amountPaise : -transaction.amountPaise,
                { showSign: true, hideValue: hideBalances },
              )}
            </span>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(transaction)}
                aria-label="Edit transaction"
                className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(transaction)}
                aria-label="Delete transaction"
                className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
