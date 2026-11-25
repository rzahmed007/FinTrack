import { BottomSheet } from '@/components/ui/BottomSheet';
import { Modal } from '@/components/ui/Modal';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useFinance } from '@/contexts/FinanceContext';
import { useIsMobile } from '@/hooks/useMediaQuery';

export function QuickTransactionModal() {
  const { quickAddOpen, quickAddPreset, closeQuickAdd } = useFinance();
  const isMobile = useIsMobile();

  const editing = quickAddPreset.editingTransaction ?? null;
  const title = editing ? 'Edit Transaction' : 'Quick Transaction';
  const description = editing
    ? 'Update the amount, category, date, or note.'
    : 'Record an expense or income in seconds.';

  if (isMobile) {
    return (
      <BottomSheet
        open={quickAddOpen}
        onClose={closeQuickAdd}
        title={title}
        description={description}
      >
        {quickAddOpen && (
          <TransactionForm
            initialType={quickAddPreset.type}
            initialCategoryId={quickAddPreset.categoryId}
            editingTransaction={editing}
            onSuccess={closeQuickAdd}
            onCancel={closeQuickAdd}
          />
        )}
      </BottomSheet>
    );
  }

  return (
    <Modal
      open={quickAddOpen}
      onClose={closeQuickAdd}
      title={title}
      description={description}
      maxWidthClass="max-w-lg"
    >
      {quickAddOpen && (
        <TransactionForm
          initialType={quickAddPreset.type}
          initialCategoryId={quickAddPreset.categoryId}
          editingTransaction={editing}
          onSuccess={closeQuickAdd}
          onCancel={closeQuickAdd}
        />
      )}
    </Modal>
  );
}
