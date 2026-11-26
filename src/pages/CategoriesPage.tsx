import { useMemo, useState } from 'react';
import {
  Check,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import {
  CATEGORY_ICON_NAMES,
  CategoryIcon,
} from '@/components/ui/CategoryIcon';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/contexts/ToastContext';
import { DEFAULT_CATEGORIES } from '@/data/defaults';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn, generateId } from '@/lib/utils';
import type { Category, ExpenseGroup, TransactionType } from '@/types/finance';

interface DraftCategoryRow {
  tempId: string;
  name: string;
  type: TransactionType;
  expenseGroup: ExpenseGroup;
  icon: string;
}

function createEmptyRow(
  type: TransactionType = 'expense',
  expenseGroup: ExpenseGroup = 'variable',
): DraftCategoryRow {
  return {
    tempId: generateId('draft'),
    name: '',
    type,
    expenseGroup,
    icon: type === 'income' ? 'PlusCircle' : 'Tag',
  };
}

export function CategoriesPage() {
  const { categories, transactions, saveCategories } = useFinance();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  // Filter / Search state
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<
    'all' | 'income' | 'fixed' | 'variable'
  >('all');

  // Create (single or multiple) modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'rows' | 'bulk'>('rows');
  const [draftRows, setDraftRows] = useState<DraftCategoryRow[]>([
    createEmptyRow(),
  ]);

  // Bulk text paste state
  const [bulkText, setBulkText] = useState('');
  const [bulkType, setBulkType] = useState<TransactionType>('expense');
  const [bulkGroup, setBulkGroup] = useState<ExpenseGroup>('variable');
  const [bulkIcon, setBulkIcon] = useState('Tag');

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editGroup, setEditGroup] = useState<ExpenseGroup>('variable');
  const [editIcon, setEditIcon] = useState('Tag');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const txCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + 1);
    }
    return map;
  }, [transactions]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((c) => {
      if (filterTab === 'income' && c.type !== 'income') return false;
      if (
        filterTab === 'fixed' &&
        !(c.type === 'expense' && c.expenseGroup === 'fixed')
      ) {
        return false;
      }
      if (
        filterTab === 'variable' &&
        !(c.type === 'expense' && c.expenseGroup !== 'fixed')
      ) {
        return false;
      }
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categories, filterTab, search]);

  const incomeCategories = filteredCategories.filter((c) => c.type === 'income');
  const fixedCategories = filteredCategories.filter(
    (c) => c.type === 'expense' && c.expenseGroup === 'fixed',
  );
  const variableCategories = filteredCategories.filter(
    (c) => c.type === 'expense' && c.expenseGroup !== 'fixed',
  );

  // Open create modal
  const openCreate = (mode: 'rows' | 'bulk' = 'rows') => {
    setCreateMode(mode);
    setDraftRows([
      createEmptyRow(),
      createEmptyRow(),
    ]);
    setBulkText('');
    setBulkType('expense');
    setBulkGroup('variable');
    setBulkIcon('Tag');
    setCreateOpen(true);
  };

  const addDraftRow = () => {
    const last = draftRows[draftRows.length - 1];
    setDraftRows((prev) => [
      ...prev,
      createEmptyRow(last?.type ?? 'expense', last?.expenseGroup ?? 'variable'),
    ]);
  };

  const updateDraftRow = (tempId: string, patch: Partial<DraftCategoryRow>) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r)),
    );
  };

  const removeDraftRow = (tempId: string) => {
    setDraftRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.tempId !== tempId) : prev,
    );
  };

  const parsedBulkNames = useMemo(() => {
    return bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [bulkText]);

  const handleSaveCreate = async () => {
    const existingNames = new Set(
      categories.map((c) => c.name.trim().toLowerCase()),
    );
    const toAdd: Category[] = [];
    const seenInBatch = new Set<string>();

    if (createMode === 'rows') {
      const nonEmpty = draftRows.filter((r) => r.name.trim().length > 0);
      if (nonEmpty.length === 0) {
        showToast({
          variant: 'error',
          title: 'Enter at least one category name',
        });
        return;
      }

      for (const row of nonEmpty) {
        const cleanName = row.name.trim();
        const key = cleanName.toLowerCase();
        if (existingNames.has(key) || seenInBatch.has(key)) {
          showToast({
            variant: 'error',
            title: `Duplicate category "${cleanName}"`,
            description: 'Each category must have a unique name.',
          });
          return;
        }
        seenInBatch.add(key);
        toAdd.push({
          id: generateId('cat'),
          name: cleanName,
          type: row.type,
          expenseGroup: row.type === 'expense' ? row.expenseGroup : undefined,
          icon: row.icon,
          isDefault: false,
          sortOrder: categories.length + toAdd.length + 1,
        });
      }
    } else {
      if (parsedBulkNames.length === 0) {
        showToast({
          variant: 'error',
          title: 'Paste or type at least one category name',
        });
        return;
      }
      for (const rawName of parsedBulkNames) {
        const key = rawName.toLowerCase();
        if (existingNames.has(key) || seenInBatch.has(key)) {
          continue; // skip duplicates quietly in bulk paste
        }
        seenInBatch.add(key);
        toAdd.push({
          id: generateId('cat'),
          name: rawName,
          type: bulkType,
          expenseGroup: bulkType === 'expense' ? bulkGroup : undefined,
          icon: bulkIcon,
          isDefault: false,
          sortOrder: categories.length + toAdd.length + 1,
        });
      }

      if (toAdd.length === 0) {
        showToast({
          variant: 'error',
          title: 'All entered categories already exist',
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      await saveCategories([...categories, ...toAdd]);
      setCreateOpen(false);
      showToast({
        variant: 'success',
        title:
          toAdd.length === 1
            ? `Added "${toAdd[0].name}"`
            : `Added ${toAdd.length} categories`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Edit category
  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditType(cat.type);
    setEditGroup(cat.expenseGroup ?? 'variable');
    setEditIcon(cat.icon || 'Tag');
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    const cleanName = editName.trim();
    if (!cleanName) {
      showToast({ variant: 'error', title: 'Category name is required' });
      return;
    }

    const duplicate = categories.some(
      (c) =>
        c.id !== editTarget.id &&
        c.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );
    if (duplicate) {
      showToast({
        variant: 'error',
        title: `Category "${cleanName}" already exists`,
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = categories.map((c) =>
        c.id === editTarget.id
          ? {
              ...c,
              name: cleanName,
              type: editType,
              expenseGroup: editType === 'expense' ? editGroup : undefined,
              icon: editIcon,
            }
          : c,
      );
      await saveCategories(updated);
      setEditTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete category
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await saveCategories(categories.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Restore missing default categories without overwriting custom ones
  const handleRestoreDefaults = async () => {
    const existingIds = new Set(categories.map((c) => c.id));
    const missing = DEFAULT_CATEGORIES.filter((d) => !existingIds.has(d.id));
    if (missing.length === 0) {
      showToast({
        variant: 'info',
        title: 'All default categories are already present',
      });
      return;
    }
    await saveCategories([...categories, ...missing]);
  };

  const renderGroup = (title: string, items: Category[]) => {
    if (items.length === 0) return null;
    return (
      <section className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {title}
          </h3>
          <Badge variant="default">{items.length}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items.map((cat) => {
            const count = txCountByCategory.get(cat.id) ?? 0;
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface-secondary/40 px-4 py-3"
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
                      {count > 0 ? ` • ${count} tx` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    aria-label={`Edit ${cat.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cat)}
                    aria-label={`Delete ${cat.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const createBody = (
    <div className="space-y-4">
      {/* Mode Switcher: Multi-Row vs Bulk Text */}
      <div className="grid grid-cols-2 gap-1.5 rounded-full border border-border bg-surface-secondary p-1">
        <button
          type="button"
          onClick={() => setCreateMode('rows')}
          className={cn(
            'min-h-[40px] rounded-full text-xs sm:text-sm font-semibold transition-all',
            createMode === 'rows'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Multi-Row Builder
        </button>
        <button
          type="button"
          onClick={() => setCreateMode('bulk')}
          className={cn(
            'min-h-[40px] rounded-full text-xs sm:text-sm font-semibold transition-all',
            createMode === 'bulk'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Quick Bulk List
        </button>
      </div>

      {createMode === 'rows' ? (
        <div className="space-y-3">
          <div className="max-h-[340px] overflow-y-auto space-y-3 pr-1">
            {draftRows.map((row, idx) => (
              <div
                key={row.tempId}
                className="rounded-2xl border border-border bg-surface-secondary/40 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Category #{idx + 1}
                  </span>
                  {draftRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDraftRow(row.tempId)}
                      aria-label="Remove row"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Input
                    label="Name"
                    placeholder="e.g. WiFi, Gym, Coffee"
                    value={row.name}
                    onChange={(e) =>
                      updateDraftRow(row.tempId, { name: e.target.value })
                    }
                  />
                  <Select
                    label="Type"
                    value={row.type}
                    onChange={(e) =>
                      updateDraftRow(row.tempId, {
                        type: e.target.value as TransactionType,
                      })
                    }
                    options={[
                      { value: 'expense', label: 'Expense' },
                      { value: 'income', label: 'Income' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {row.type === 'expense' && (
                    <Select
                      label="Group"
                      value={row.expenseGroup}
                      onChange={(e) =>
                        updateDraftRow(row.tempId, {
                          expenseGroup: e.target.value as ExpenseGroup,
                        })
                      }
                      options={[
                        { value: 'variable', label: 'Personal / Variable' },
                        { value: 'fixed', label: 'Fixed Commitment' },
                      ]}
                    />
                  )}
                  <Select
                    label="Icon"
                    value={row.icon}
                    onChange={(e) =>
                      updateDraftRow(row.tempId, { icon: e.target.value })
                    }
                    options={CATEGORY_ICON_NAMES.map((ic) => ({
                      value: ic,
                      label: ic,
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDraftRow}
            leftIcon={<Plus className="h-4 w-4" />}
            className="w-full"
          >
            Add Another Row
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="bulk-categories-input"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Category Names (comma or line separated)
            </label>
            <textarea
              id="bulk-categories-input"
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'WiFi Bill, Gym, Coffee\nLaundry\nBooks'}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <p className="text-xs text-muted-foreground">
              {parsedBulkNames.length} category name(s) detected
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Type"
              value={bulkType}
              onChange={(e) => setBulkType(e.target.value as TransactionType)}
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
            />
            {bulkType === 'expense' && (
              <Select
                label="Group"
                value={bulkGroup}
                onChange={(e) => setBulkGroup(e.target.value as ExpenseGroup)}
                options={[
                  { value: 'variable', label: 'Personal / Variable' },
                  { value: 'fixed', label: 'Fixed Commitment' },
                ]}
              />
            )}
            <Select
              label="Icon"
              value={bulkIcon}
              onChange={(e) => setBulkIcon(e.target.value)}
              options={CATEGORY_ICON_NAMES.map((ic) => ({
                value: ic,
                label: ic,
              }))}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        <Button variant="outline" onClick={() => setCreateOpen(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveCreate}
          isLoading={isSaving}
          leftIcon={<Check className="h-4 w-4" />}
        >
          {createMode === 'rows'
            ? `Save ${draftRows.filter((r) => r.name.trim()).length || ''} Categor${
                draftRows.filter((r) => r.name.trim()).length === 1 ? 'y' : 'ies'
              }`
            : `Add ${parsedBulkNames.length || ''} Categor${
                parsedBulkNames.length === 1 ? 'y' : 'ies'
              }`}
        </Button>
      </div>
    </div>
  );

  const editBody = (
    <div className="space-y-4">
      <Input
        label="Category Name"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Type"
          value={editType}
          onChange={(e) => setEditType(e.target.value as TransactionType)}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
        />
        {editType === 'expense' && (
          <Select
            label="Expense Group"
            value={editGroup}
            onChange={(e) => setEditGroup(e.target.value as ExpenseGroup)}
            options={[
              { value: 'variable', label: 'Personal / Variable' },
              { value: 'fixed', label: 'Fixed Commitment' },
            ]}
          />
        )}
      </div>

      <div className="space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Icon
        </span>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[150px] overflow-y-auto p-0.5">
          {CATEGORY_ICON_NAMES.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setEditIcon(ic)}
              title={ic}
              aria-label={`Select icon ${ic}`}
              className={cn(
                'flex h-10 w-full items-center justify-center rounded-xl border transition-colors',
                editIcon === ic
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'border-border bg-surface text-foreground hover:bg-surface-hover',
              )}
            >
              <CategoryIcon icon={ic} className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        <Button variant="outline" onClick={() => setEditTarget(null)}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveEdit}
          isLoading={isSaving}
          leftIcon={<Check className="h-4 w-4" />}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Classification • {categories.length} Categories
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Income & Expense Categories
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleRestoreDefaults}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Restore Defaults
          </Button>
          <Button
            variant="outline"
            onClick={() => openCreate('bulk')}
            leftIcon={<Layers className="h-4 w-4" />}
          >
            Bulk Paste
          </Button>
          <Button
            onClick={() => openCreate('rows')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Categories
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[24px] border border-border bg-surface p-4 shadow-card dark:shadow-card-dark">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAdornment={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="inline-flex flex-wrap rounded-full border border-border bg-surface-secondary p-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'income', label: 'Income' },
              { id: 'fixed', label: 'Fixed' },
              { id: 'variable', label: 'Personal' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={cn(
                'min-h-[38px] rounded-full px-3.5 text-xs font-semibold transition-all',
                filterTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Try clearing the search filter or add new categories."
          action={
            <Button onClick={() => openCreate('rows')}>Add Categories</Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {renderGroup('Income Categories', incomeCategories)}
          {renderGroup('Fixed Expense Categories', fixedCategories)}
          {renderGroup(
            'Personal / Variable Expense Categories',
            variableCategories,
          )}
        </div>
      )}

      {/* Create Modal / BottomSheet */}
      {isMobile ? (
        <BottomSheet
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Add Categories"
          description="Add one or multiple categories at once."
        >
          {createBody}
        </BottomSheet>
      ) : (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Add Categories"
          description="Add multiple categories via rows or comma/line-separated paste."
          maxWidthClass="max-w-xl"
        >
          {createBody}
        </Modal>
      )}

      {/* Edit Modal / BottomSheet */}
      {isMobile ? (
        <BottomSheet
          open={Boolean(editTarget)}
          onClose={() => setEditTarget(null)}
          title={`Edit ${editTarget?.name ?? 'Category'}`}
        >
          {editBody}
        </BottomSheet>
      ) : (
        <Modal
          open={Boolean(editTarget)}
          onClose={() => setEditTarget(null)}
          title={`Edit ${editTarget?.name ?? 'Category'}`}
        >
          {editBody}
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isSaving}
        title={`Delete "${deleteTarget?.name ?? ''}"?`}
        description={
          deleteTarget && (txCountByCategory.get(deleteTarget.id) ?? 0) > 0
            ? `${txCountByCategory.get(
                deleteTarget.id,
              )} recorded transaction(s) reference this category. Deleting it removes it from selection lists.`
            : 'This removes the category from your workspace.'
        }
        confirmLabel="Delete Category"
      />
    </div>
  );
}
