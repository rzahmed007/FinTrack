import { useState } from 'react';
import { CalendarClock, Check, Plus, ShieldCheck } from 'lucide-react';
import { EMICard } from '@/components/finance/EMICard';
import { StatCard } from '@/components/finance/StatCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/contexts/ToastContext';
import { DEFAULT_USER_ID } from '@/data/defaults';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { generateId } from '@/lib/utils';
import type { EMIItem } from '@/types/finance';
import {
  formatINR,
  formatRupeeInputValue,
  rupeesToPaise,
} from '@/utils/currency';
import { getTodayIST, toMonthKey } from '@/utils/date';

export function EMIPage() {
  const { user } = useAuth();
  const {
    emis,
    categories,
    selectedMonthYear,
    hideBalances,
    payEMIInstallment,
    upsertEMI,
  } = useFinance();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const [configTarget, setConfigTarget] = useState<EMIItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Configure form state
  const [nameInput, setNameInput] = useState('');
  const [monthlyInput, setMonthlyInput] = useState('');
  const [tenureInput, setTenureInput] = useState('');
  const [totalLoanInput, setTotalLoanInput] = useState('');
  const [dueDayInput, setDueDayInput] = useState('5');
  const [startDateInput, setStartDateInput] = useState(getTodayIST());
  const [categoryInput, setCategoryInput] = useState('ac_emi');
  const [isSaving, setIsSaving] = useState(false);

  const openConfigure = (emi: EMIItem) => {
    setConfigTarget(emi);
    setNameInput(emi.name);
    setMonthlyInput(formatRupeeInputValue(emi.monthlyInstallmentPaise));
    setTenureInput(
      emi.totalInstallments !== null ? String(emi.totalInstallments) : '',
    );
    setTotalLoanInput(
      emi.totalLoanPaise !== null
        ? formatRupeeInputValue(emi.totalLoanPaise)
        : '',
    );
    setDueDayInput(String(emi.dueDay));
    setStartDateInput(emi.startDate);
    setCategoryInput(emi.categoryId);
  };

  const openCreate = () => {
    setConfigTarget(null);
    setNameInput('');
    setMonthlyInput('');
    setTenureInput('');
    setTotalLoanInput('');
    setDueDayInput('5');
    setStartDateInput(getTodayIST());
    setCategoryInput('ac_emi');
    setCreateOpen(true);
  };

  const closeForm = () => {
    setConfigTarget(null);
    setCreateOpen(false);
  };

  const handleSaveEMI = async () => {
    const monthlyPaise = rupeesToPaise(monthlyInput);
    if (!nameInput.trim() || monthlyPaise <= 0) {
      showToast({
        variant: 'error',
        title: 'Enter EMI name and valid monthly installment',
      });
      return;
    }

    const parsedTenure = tenureInput.trim()
      ? parseInt(tenureInput.trim(), 10)
      : null;
    const parsedTotalLoan = totalLoanInput.trim()
      ? rupeesToPaise(totalLoanInput.trim())
      : null;
    const dueDay = Math.min(28, Math.max(1, parseInt(dueDayInput, 10) || 5));

    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const base: EMIItem = configTarget ?? {
        id: generateId('emi'),
        userId: user?.id ?? DEFAULT_USER_ID,
        name: nameInput.trim(),
        categoryId: categoryInput,
        monthlyInstallmentPaise: monthlyPaise,
        totalInstallments: parsedTenure,
        totalLoanPaise: parsedTotalLoan,
        startDate: startDateInput,
        dueDay,
        status: 'active',
        payments: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const nextPaidCount = base.payments.length;
      const isCompleted =
        parsedTenure !== null && parsedTenure > 0 && nextPaidCount >= parsedTenure;

      await upsertEMI({
        ...base,
        name: nameInput.trim(),
        categoryId: categoryInput,
        monthlyInstallmentPaise: monthlyPaise,
        totalInstallments:
          parsedTenure && parsedTenure > 0 ? parsedTenure : null,
        totalLoanPaise:
          parsedTotalLoan && parsedTotalLoan > 0 ? parsedTotalLoan : null,
        startDate: startDateInput,
        dueDay,
        status: isCompleted ? 'completed' : 'active',
      });
      closeForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkPaid = async (emi: EMIItem, installmentKey: string) => {
    try {
      await payEMIInstallment({
        emi,
        installmentKey,
        paidDate: getTodayIST(),
      });
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Duplicate payment prevented',
        description: err instanceof Error ? err.message : 'Already paid.',
      });
    }
  };

  const monthKey = toMonthKey(selectedMonthYear.year, selectedMonthYear.month);
  const totalMonthlyCommitment = emis
    .filter((e) => e.status === 'active')
    .reduce((sum, e) => sum + e.monthlyInstallmentPaise, 0);
  const paidThisMonthCount = emis.filter((e) =>
    e.payments.some((p) => p.installmentKey === monthKey),
  ).length;

  const modalOpen = Boolean(configTarget) || createOpen;

  const formBody = (
    <div className="space-y-4">
      <Input
        label="EMI Name"
        placeholder="e.g. AC EMI"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CurrencyInput
          label="Monthly Installment"
          value={monthlyInput}
          onChange={setMonthlyInput}
        />
        <Select
          label="Expense Category"
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          options={categories
            .filter((c) => c.type === 'expense')
            .map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Total Tenure (Months, Optional)"
          type="number"
          min={1}
          placeholder="Leave blank if unknown"
          value={tenureInput}
          onChange={(e) => setTenureInput(e.target.value)}
        />
        <CurrencyInput
          label="Total Loan Amount (Optional)"
          placeholder="Leave blank if unknown"
          value={totalLoanInput}
          onChange={setTotalLoanInput}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DatePicker
          label="Start Date"
          value={startDateInput}
          onChange={(e) => setStartDateInput(e.target.value)}
        />
        <Input
          label="Monthly Due Day (1–28)"
          type="number"
          min={1}
          max={28}
          value={dueDayInput}
          onChange={(e) => setDueDayInput(e.target.value)}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        <Button variant="outline" onClick={closeForm}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveEMI}
          isLoading={isSaving}
          leftIcon={<Check className="h-4 w-4" />}
        >
          Save EMI Settings
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Installment Tracker
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            EMI Management
          </h2>
        </div>

        <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
          Add EMI
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Monthly EMIs"
          value={formatINR(totalMonthlyCommitment, { hideValue: hideBalances })}
          icon={<CalendarClock className="h-4 w-4" />}
          subtitle={`${emis.filter((e) => e.status === 'active').length} active schedule(s)`}
        />
        <StatCard
          label={`Status for ${monthKey}`}
          value={`${paidThisMonthCount} / ${emis.length} Paid`}
          icon={<ShieldCheck className="h-4 w-4" />}
          subtitle="Duplicate payments are automatically blocked"
        />
        <StatCard
          label="Lifetime EMI Paid"
          value={formatINR(
            emis.reduce(
              (sum, e) =>
                sum + e.payments.reduce((s, p) => s + p.amountPaise, 0),
              0,
            ),
            { hideValue: hideBalances },
          )}
          icon={<Check className="h-4 w-4" />}
          subtitle="Across all recorded installments"
        />
      </div>

      {emis.length === 0 ? (
        <EmptyState
          title="No EMI schedules configured"
          description="Add an EMI schedule to track installments and record monthly payments cleanly."
          action={<Button onClick={openCreate}>Add EMI</Button>}
        />
      ) : (
        <div className="space-y-4">
          {emis.map((emi) => (
            <EMICard
              key={emi.id}
              emi={emi}
              year={selectedMonthYear.year}
              month={selectedMonthYear.month}
              hideBalances={hideBalances}
              onMarkPaid={handleMarkPaid}
              onConfigure={openConfigure}
            />
          ))}
        </div>
      )}

      {isMobile ? (
        <BottomSheet
          open={modalOpen}
          onClose={closeForm}
          title={configTarget ? `Configure ${configTarget.name}` : 'Add New EMI'}
          description="Loan tenure and total loan amount are optional and user-configurable."
        >
          {formBody}
        </BottomSheet>
      ) : (
        <Modal
          open={modalOpen}
          onClose={closeForm}
          title={configTarget ? `Configure ${configTarget.name}` : 'Add New EMI'}
          description="Loan tenure and total loan amount are optional and user-configurable."
        >
          {formBody}
        </Modal>
      )}
    </div>
  );
}
