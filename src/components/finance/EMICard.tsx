import { useState } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { EMIItem } from '@/types/finance';
import { getEMIDueDateForMonth } from '@/utils/calculations';
import { formatINR } from '@/utils/currency';
import { formatDateDisplay, toMonthKey } from '@/utils/date';

export interface EMICardProps {
  emi: EMIItem;
  year: number;
  month: number;
  hideBalances?: boolean;
  onMarkPaid: (emi: EMIItem, installmentKey: string) => void;
  onConfigure: (emi: EMIItem) => void;
}

export function EMICard({
  emi,
  year,
  month,
  hideBalances = false,
  onMarkPaid,
  onConfigure,
}: EMICardProps) {
  const [showHistory, setShowHistory] = useState(false);

  const monthKey = toMonthKey(year, month);
  const isPaidThisMonth = emi.payments.some(
    (p) => p.installmentKey === monthKey,
  );
  const paidCount = emi.payments.length;
  const remainingCount =
    emi.totalInstallments !== null
      ? Math.max(0, emi.totalInstallments - paidCount)
      : null;
  const nextDueDate = getEMIDueDateForMonth(emi.dueDay, year, month);
  const isCompleted = emi.status === 'completed';

  return (
    <div className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {emi.name}
            </h3>
            {isCompleted ? (
              <Badge variant="solid">Completed</Badge>
            ) : isPaidThisMonth ? (
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3" />
                Paid for {monthKey}
              </Badge>
            ) : (
              <Badge variant="striped">Due {formatDateDisplay(nextDueDate, 'short')}</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Started {formatDateDisplay(emi.startDate, 'medium')} • Due on day{' '}
            {emi.dueDay} every month
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly Installment
          </p>
          <p className="text-2xl font-extrabold text-foreground tabular-nums">
            {formatINR(emi.monthlyInstallmentPaise, { hideValue: hideBalances })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-border bg-surface-secondary/60 p-3.5 text-xs">
        <div>
          <span className="text-muted-foreground">Paid Installments</span>
          <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
            {paidCount}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Total Tenure</span>
          <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
            {emi.totalInstallments !== null
              ? `${emi.totalInstallments} months`
              : 'Not set'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Remaining</span>
          <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
            {remainingCount !== null ? `${remainingCount} left` : 'Configure'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Total Loan</span>
          <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
            {emi.totalLoanPaise !== null
              ? formatINR(emi.totalLoanPaise, { hideValue: hideBalances })
              : 'Not set'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isPaidThisMonth || isCompleted ? 'secondary' : 'primary'}
            size="sm"
            disabled={isPaidThisMonth || isCompleted || emi.status === 'paused'}
            onClick={() => onMarkPaid(emi, monthKey)}
            leftIcon={<CalendarCheck2 className="h-4 w-4" />}
          >
            {isCompleted
              ? 'Loan Completed'
              : isPaidThisMonth
                ? `Paid (${monthKey})`
                : `Mark ${monthKey} Paid`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfigure(emi)}
            leftIcon={<Settings2 className="h-4 w-4" />}
          >
            Configure Loan
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowHistory((s) => !s)}
          className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <span>Payment History ({paidCount})</span>
          {showHistory ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {showHistory && (
        <div className="border-t border-border pt-3 space-y-2">
          {emi.payments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No EMI payments recorded yet.
            </p>
          ) : (
            [...emi.payments]
              .sort((a, b) => b.paidDate.localeCompare(a.paidDate))
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/40 px-3.5 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground tabular-nums">
                      #{p.installmentNumber}
                    </span>
                    <span className="text-muted-foreground">
                      {p.installmentKey} • Paid{' '}
                      {formatDateDisplay(p.paidDate, 'medium')}
                    </span>
                  </div>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatINR(p.amountPaise, { hideValue: hideBalances })}
                  </span>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
