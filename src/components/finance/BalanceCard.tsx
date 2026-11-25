import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Eye,
  EyeOff,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/utils/currency';

export interface BalanceCardProps {
  availableBalancePaise: number;
  openingBalancePaise: number;
  netCashFlowPaise: number;
  monthLabel: string;
  hideBalances: boolean;
  onToggleHide: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onRecordEMI: () => void;
}

export function BalanceCard({
  availableBalancePaise,
  openingBalancePaise,
  netCashFlowPaise,
  monthLabel,
  hideBalances,
  onToggleHide,
  onAddIncome,
  onAddExpense,
  onRecordEMI,
}: BalanceCardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.section
      initial={prefersReduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.22 }}
      aria-label="Available Balance Summary"
      className="rounded-[24px] border border-border bg-black text-white dark:bg-[#171717] dark:text-white p-6 sm:p-8 shadow-card dark:shadow-card-dark"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/65">
              Available Balance
            </span>
            <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white/80">
              {monthLabel}
            </span>
          </div>

          <motion.div
            key={`${availableBalancePaise}-${hideBalances}`}
            initial={prefersReduced ? false : { opacity: 0.4, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.18 }}
            className="pt-2 text-[34px] leading-tight sm:text-[44px] lg:text-[48px] font-extrabold tracking-tight tabular-nums"
          >
            {formatINR(availableBalancePaise, { hideValue: hideBalances })}
          </motion.div>
        </div>

        <button
          type="button"
          onClick={onToggleHide}
          aria-label={hideBalances ? 'Reveal financial amounts' : 'Hide financial amounts'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {hideBalances ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-4 text-xs sm:text-sm text-white/75">
        <div className="flex items-center gap-1.5">
          <span>Opening carried forward:</span>
          <strong className="font-semibold text-white tabular-nums">
            {formatINR(openingBalancePaise, { hideValue: hideBalances })}
          </strong>
        </div>
        <div className="flex items-center gap-1.5">
          {netCashFlowPaise >= 0 ? (
            <TrendingUp className="h-4 w-4 text-white" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-4 w-4 text-white" aria-hidden="true" />
          )}
          <span>Monthly net cash flow:</span>
          <strong className="font-semibold text-white tabular-nums">
            {formatINR(netCashFlowPaise, {
              showSign: true,
              hideValue: hideBalances,
            })}
          </strong>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <Button
          onClick={onAddExpense}
          className="bg-white text-black hover:bg-white/90 flex-1 sm:flex-none"
          leftIcon={<ArrowUpRight className="h-4 w-4" />}
        >
          Add Expense
        </Button>
        <Button
          onClick={onAddIncome}
          variant="outline"
          className="border-white/30 bg-transparent text-white hover:bg-white/15 flex-1 sm:flex-none"
          leftIcon={<ArrowDownLeft className="h-4 w-4" />}
        >
          Add Income
        </Button>
        <Button
          onClick={onRecordEMI}
          variant="outline"
          className="border-white/30 bg-transparent text-white hover:bg-white/15 w-full sm:w-auto"
          leftIcon={<CalendarClock className="h-4 w-4" />}
        >
          Record EMI Payment
        </Button>
      </div>
    </motion.section>
  );
}
