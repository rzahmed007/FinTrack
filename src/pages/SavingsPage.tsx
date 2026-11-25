import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { StatCard } from '@/components/finance/StatCard';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/contexts/ToastContext';
import { DEFAULT_USER_ID } from '@/data/defaults';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { generateId } from '@/lib/utils';
import type { SavingsGoal, SavingsTransferType } from '@/types/finance';
import { formatINR, rupeesToPaise } from '@/utils/currency';
import { formatDateDisplay, getTodayIST } from '@/utils/date';

export function SavingsPage() {
  const { user } = useAuth();
  const {
    savingsSummary,
    savingsTransfers,
    hideBalances,
    upsertSavingsGoal,
    deleteSavingsGoal,
    addSavingsTransfer,
  } = useFinance();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const prefersReduced = useReducedMotion();

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalNote, setGoalNote] = useState('');

  const [transferGoal, setTransferGoal] = useState<SavingsGoal | null>(null);
  const [transferType, setTransferType] =
    useState<SavingsTransferType>('deposit');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(getTodayIST());
  const [transferNote, setTransferNote] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);

  const handleCreateGoal = async () => {
    const targetPaise = rupeesToPaise(goalTarget);
    if (!goalName.trim() || targetPaise <= 0) {
      showToast({
        variant: 'error',
        title: 'Enter goal name and valid target amount',
      });
      return;
    }
    const nowIso = new Date().toISOString();
    await upsertSavingsGoal({
      id: generateId('goal'),
      userId: user?.id ?? DEFAULT_USER_ID,
      name: goalName.trim(),
      targetPaise,
      targetDate: goalDate || undefined,
      note: goalNote.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    setGoalName('');
    setGoalTarget('');
    setGoalDate('');
    setGoalNote('');
    setGoalModalOpen(false);
  };

  const openTransfer = (goal: SavingsGoal, type: SavingsTransferType) => {
    setTransferGoal(goal);
    setTransferType(type);
    setTransferAmount('');
    setTransferDate(getTodayIST());
    setTransferNote('');
  };

  const handleSubmitTransfer = async () => {
    if (!transferGoal) return;
    const amountPaise = rupeesToPaise(transferAmount);
    if (amountPaise <= 0) {
      showToast({ variant: 'error', title: 'Enter an amount above ₹0' });
      return;
    }

    const currentGoalSummary = savingsSummary.goals.find(
      (g) => g.goal.id === transferGoal.id,
    );
    if (
      transferType === 'withdrawal' &&
      currentGoalSummary &&
      amountPaise > currentGoalSummary.currentSavedPaise
    ) {
      showToast({
        variant: 'error',
        title: 'Withdrawal exceeds saved balance',
        description: `Available in ${transferGoal.name}: ${formatINR(
          currentGoalSummary.currentSavedPaise,
        )}`,
      });
      return;
    }

    await addSavingsTransfer({
      goalId: transferGoal.id,
      type: transferType,
      amountPaise,
      date: transferDate,
      note: transferNote.trim() || undefined,
    });
    setTransferGoal(null);
  };

  const goalNameMap = new Map(
    savingsSummary.goals.map((g) => [g.goal.id, g.goal.name]),
  );

  const createGoalBody = (
    <div className="space-y-4">
      <Input
        label="Goal Name"
        placeholder="e.g. Emergency Reserve"
        value={goalName}
        onChange={(e) => setGoalName(e.target.value)}
      />
      <CurrencyInput
        label="Target Amount"
        value={goalTarget}
        onChange={setGoalTarget}
      />
      <DatePicker
        label="Target Date (Optional)"
        value={goalDate}
        onChange={(e) => setGoalDate(e.target.value)}
      />
      <Input
        label="Note (Optional)"
        placeholder="Purpose of this goal"
        value={goalNote}
        onChange={(e) => setGoalNote(e.target.value)}
      />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        <Button variant="outline" onClick={() => setGoalModalOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleCreateGoal}>Create Goal</Button>
      </div>
    </div>
  );

  const transferBody = (
    <div className="space-y-4">
      <CurrencyInput
        label={
          transferType === 'deposit' ? 'Amount to Save' : 'Amount to Withdraw'
        }
        size="hero"
        autoFocus
        value={transferAmount}
        onChange={setTransferAmount}
      />
      <DatePicker
        label="Date"
        value={transferDate}
        onChange={(e) => setTransferDate(e.target.value)}
        showQuickToday
        onQuickSelect={setTransferDate}
      />
      <Input
        label="Note (Optional)"
        placeholder="e.g. Monthly surplus transfer"
        value={transferNote}
        onChange={(e) => setTransferNote(e.target.value)}
      />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        <Button variant="outline" onClick={() => setTransferGoal(null)}>
          Cancel
        </Button>
        <Button onClick={handleSubmitTransfer}>
          {transferType === 'deposit' ? 'Add to Savings' : 'Withdraw Savings'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Goal Reserves
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Savings & Targets
          </h2>
        </div>

        <Button
          onClick={() => setGoalModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Savings Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Saved"
          value={formatINR(savingsSummary.totalSavedPaise, {
            hideValue: hideBalances,
          })}
          icon={<PiggyBank className="h-4 w-4" />}
          subtitle="Tracked separately from expenses (no double counting)"
          emphasized
        />
        <StatCard
          label="Combined Target"
          value={formatINR(savingsSummary.totalTargetPaise, {
            hideValue: hideBalances,
          })}
          icon={<Target className="h-4 w-4" />}
          subtitle={`${savingsSummary.goals.length} active goal(s)`}
        />
        <StatCard
          label="Remaining to Target"
          value={formatINR(
            Math.max(
              0,
              savingsSummary.totalTargetPaise - savingsSummary.totalSavedPaise,
            ),
            { hideValue: hideBalances },
          )}
          icon={<ArrowUpRight className="h-4 w-4" />}
          subtitle="Across all configured goals"
        />
      </div>

      {/* Savings Goals Grid */}
      {savingsSummary.goals.length === 0 ? (
        <EmptyState
          title="No savings goals yet"
          description="Create a savings goal to set aside funds separately from daily expenses."
          action={
            <Button onClick={() => setGoalModalOpen(true)}>
              Create Savings Goal
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsSummary.goals.map((item) => (
            <section
              key={item.goal.id}
              className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {item.goal.name}
                    </h3>
                    <Badge variant="default">{item.progressPct}%</Badge>
                  </div>
                  {item.goal.note && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.goal.note}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(item.goal)}
                  aria-label={`Delete ${item.goal.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-secondary border border-border/60">
                <motion.div
                  initial={prefersReduced ? false : { width: 0 }}
                  animate={{ width: `${item.progressPct}%` }}
                  transition={{ duration: prefersReduced ? 0 : 0.28 }}
                  className="h-full rounded-full bg-foreground"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
                <div>
                  <span className="text-muted-foreground">Saved</span>
                  <p className="mt-0.5 text-sm font-extrabold text-foreground">
                    {formatINR(item.currentSavedPaise, {
                      hideValue: hideBalances,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Target</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {formatINR(item.goal.targetPaise, {
                      hideValue: hideBalances,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {formatINR(item.remainingPaise, {
                      hideValue: hideBalances,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => openTransfer(item.goal, 'deposit')}
                  leftIcon={<ArrowDownLeft className="h-4 w-4" />}
                >
                  Add Savings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={item.currentSavedPaise <= 0}
                  onClick={() => openTransfer(item.goal, 'withdrawal')}
                  leftIcon={<ArrowUpRight className="h-4 w-4" />}
                >
                  Withdraw
                </Button>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Savings Transfers Log */}
      <section className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Savings Transfer History
          </h3>
          <p className="text-xs text-muted-foreground">
            Deposits and withdrawals are isolated from expense reports
          </p>
        </div>

        {savingsTransfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No savings transfers recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {savingsTransfers.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-secondary/40 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground truncate">
                      {goalNameMap.get(tr.goalId) ?? 'Savings Goal'}
                    </span>
                    <Badge
                      variant={tr.type === 'deposit' ? 'solid' : 'outline'}
                    >
                      {tr.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateDisplay(tr.date, 'medium')}
                    {tr.note ? ` • ${tr.note}` : ''}
                  </p>
                </div>

                <span className="font-extrabold text-foreground tabular-nums shrink-0">
                  {formatINR(
                    tr.type === 'deposit' ? tr.amountPaise : -tr.amountPaise,
                    { showSign: true, hideValue: hideBalances },
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {isMobile ? (
        <BottomSheet
          open={goalModalOpen}
          onClose={() => setGoalModalOpen(false)}
          title="New Savings Goal"
        >
          {createGoalBody}
        </BottomSheet>
      ) : (
        <Modal
          open={goalModalOpen}
          onClose={() => setGoalModalOpen(false)}
          title="New Savings Goal"
        >
          {createGoalBody}
        </Modal>
      )}

      {isMobile ? (
        <BottomSheet
          open={Boolean(transferGoal)}
          onClose={() => setTransferGoal(null)}
          title={
            transferGoal
              ? `${transferType === 'deposit' ? 'Add to' : 'Withdraw from'} ${transferGoal.name}`
              : ''
          }
        >
          {transferBody}
        </BottomSheet>
      ) : (
        <Modal
          open={Boolean(transferGoal)}
          onClose={() => setTransferGoal(null)}
          title={
            transferGoal
              ? `${transferType === 'deposit' ? 'Add to' : 'Withdraw from'} ${transferGoal.name}`
              : ''
          }
        >
          {transferBody}
        </Modal>
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSavingsGoal(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Savings Goal?"
        description={
          deleteTarget
            ? `This removes "${deleteTarget.name}" and its savings transfer records.`
            : ''
        }
        confirmLabel="Delete Goal"
      />
    </div>
  );
}
