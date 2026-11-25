import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { useFinance } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';
import type { CategoryId, Transaction, TransactionType } from '@/types/finance';
import { formatRupeeInputValue, rupeesToPaise } from '@/utils/currency';
import { getTodayIST } from '@/utils/date';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .min(1, 'Enter an amount')
    .refine((val) => rupeesToPaise(val) > 0, {
      message: 'Amount must be greater than ₹0',
    }),
  categoryId: z.string().min(1, 'Select a category'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date'),
  note: z.string().max(160, 'Note must be 160 characters or less').optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export interface TransactionFormProps {
  initialType?: TransactionType;
  initialCategoryId?: CategoryId;
  editingTransaction?: Transaction | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  initialType = 'expense',
  initialCategoryId,
  editingTransaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { categories, addTransaction, editTransaction } = useFinance();

  const defaultType: TransactionType =
    editingTransaction?.type ?? initialType;

  const getDefaultCategory = (t: TransactionType) => {
    if (editingTransaction && editingTransaction.type === t) {
      return editingTransaction.categoryId;
    }
    if (initialCategoryId) {
      const matched = categories.find(
        (c) => c.id === initialCategoryId && c.type === t,
      );
      if (matched) return matched.id;
    }
    return t === 'income' ? 'salary' : 'food';
  };

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: editingTransaction
        ? formatRupeeInputValue(editingTransaction.amountPaise)
        : '',
      categoryId: getDefaultCategory(defaultType),
      date: editingTransaction?.date ?? getTodayIST(),
      note: editingTransaction?.note ?? '',
    },
  });

  const activeType = watch('type');
  const activeCategory = watch('categoryId');

  const filteredCategories = categories.filter((c) => c.type === activeType);

  useEffect(() => {
    const valid = filteredCategories.some((c) => c.id === activeCategory);
    if (!valid && filteredCategories[0]) {
      setValue('categoryId', filteredCategories[0].id);
    }
  }, [activeType, activeCategory, filteredCategories, setValue]);

  const onSubmit = async (values: TransactionFormValues) => {
    const amountPaise = rupeesToPaise(values.amount);
    if (editingTransaction) {
      await editTransaction(editingTransaction.id, {
        type: values.type,
        amountPaise,
        categoryId: values.categoryId,
        date: values.date,
        note: values.note,
      });
    } else {
      await addTransaction({
        type: values.type,
        amountPaise,
        categoryId: values.categoryId,
        date: values.date,
        note: values.note,
      });
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Segmented Income / Expense Toggle */}
      <div
        className="grid grid-cols-2 gap-1.5 rounded-full border border-border bg-surface-secondary p-1"
        role="radiogroup"
        aria-label="Transaction type"
      >
        <button
          type="button"
          onClick={() => setValue('type', 'expense')}
          className={cn(
            'flex min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-bold transition-all',
            activeType === 'expense'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ArrowUpRight className="h-4 w-4" />
          Expense
        </button>
        <button
          type="button"
          onClick={() => setValue('type', 'income')}
          className={cn(
            'flex min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-bold transition-all',
            activeType === 'income'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ArrowDownLeft className="h-4 w-4" />
          Income
        </button>
      </div>

      {/* Large Hero Currency Input for 5-10s quick entry */}
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <CurrencyInput
            label="Amount (INR)"
            size="hero"
            autoFocus={!editingTransaction}
            placeholder="0"
            value={field.value}
            onChange={field.onChange}
            error={errors.amount?.message}
          />
        )}
      />

      {/* Quick Category Chip Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </span>
          {errors.categoryId && (
            <span className="text-xs font-medium text-foreground">
              {errors.categoryId.message}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[210px] overflow-y-auto pr-0.5">
          {filteredCategories.map((cat) => {
            const selected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setValue('categoryId', cat.id, { shouldValidate: true })
                }
                className={cn(
                  'flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition-all',
                  selected
                    ? 'border-foreground bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-foreground hover:bg-surface-hover',
                )}
              >
                <CategoryIcon icon={cat.icon} className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              label="Date"
              value={field.value}
              onChange={field.onChange}
              showQuickToday
              onQuickSelect={(d) => field.onChange(d)}
              error={errors.date?.message}
            />
          )}
        />

        <Input
          label="Note (Optional)"
          placeholder="e.g. Petrol refill, lunch"
          error={errors.note?.message}
          {...register('note')}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isSubmitting}
          leftIcon={<Check className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          {editingTransaction ? 'Save Changes' : 'Save Transaction'}
        </Button>
      </div>
    </form>
  );
}
