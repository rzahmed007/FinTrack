import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/contexts/ToastContext';
import { generateId } from '@/lib/utils';
import type { Category, ExpenseGroup, TransactionType } from '@/types/finance';

export function CategoriesPage() {
  const { categories, saveCategories } = useFinance();
  const { showToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [expenseGroup, setExpenseGroup] = useState<ExpenseGroup>('variable');

  const handleAddCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast({ variant: 'error', title: 'Enter a category name' });
      return;
    }
    const next: Category = {
      id: generateId('cat'),
      name: trimmed,
      type,
      expenseGroup: type === 'expense' ? expenseGroup : undefined,
      icon: type === 'income' ? 'PlusCircle' : 'Receipt',
      isDefault: false,
      sortOrder: categories.length + 1,
    };
    await saveCategories([...categories, next]);
    setName('');
    setCreateOpen(false);
  };

  const handleRemove = async (cat: Category) => {
    if (cat.isDefault) return;
    await saveCategories(categories.filter((c) => c.id !== cat.id));
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const fixedCategories = categories.filter(
    (c) => c.type === 'expense' && c.expenseGroup === 'fixed',
  );
  const variableCategories = categories.filter(
    (c) => c.type === 'expense' && c.expenseGroup !== 'fixed',
  );

  const renderGroup = (title: string, items: Category[]) => (
    <section className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-foreground">
          {title}
        </h3>
        <Badge variant="default">{items.length}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {items.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface-secondary/40 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                <CategoryIcon icon={cat.icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {cat.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {cat.isDefault ? 'Default' : 'Custom'}
                </p>
              </div>
            </div>

            {!cat.isDefault && (
              <button
                type="button"
                onClick={() => handleRemove(cat)}
                aria-label={`Remove ${cat.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Classification
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Income & Expense Categories
          </h2>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Category
        </Button>
      </div>

      {renderGroup('Income Categories', incomeCategories)}
      {renderGroup('Fixed Expense Categories', fixedCategories)}
      {renderGroup('Personal / Variable Expense Categories', variableCategories)}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Custom Category"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Internet Bill, Books"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
          />
          {type === 'expense' && (
            <Select
              label="Expense Group"
              value={expenseGroup}
              onChange={(e) => setExpenseGroup(e.target.value as ExpenseGroup)}
              options={[
                { value: 'variable', label: 'Personal / Variable Expense' },
                { value: 'fixed', label: 'Fixed Commitment' },
              ]}
            />
          )}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Save Category</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
