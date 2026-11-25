import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { cn } from '@/lib/utils';
import { formatINR } from '@/utils/currency';

export interface BudgetProgressCardProps {
  title: string;
  icon?: string;
  allocatedPaise: number;
  actualPaise: number;
  remainingPaise: number;
  utilizationPct: number;
  isOverspent: boolean;
  hasZeroBudget?: boolean;
  hideBalances?: boolean;
}

export function BudgetProgressCard({
  title,
  icon,
  allocatedPaise,
  actualPaise,
  remainingPaise,
  utilizationPct,
  isOverspent,
  hasZeroBudget = false,
  hideBalances = false,
}: BudgetProgressCardProps) {
  const prefersReduced = useReducedMotion();
  const clampedWidth = Math.min(100, Math.max(0, utilizationPct));

  return (
    <div className="rounded-[24px] border border-border bg-surface p-5 shadow-card dark:shadow-card-dark space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary">
              <CategoryIcon icon={icon} className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-foreground">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground tabular-nums">
              {hasZeroBudget
                ? 'No budget allocated'
                : `Allocated: ${formatINR(allocatedPaise, { hideValue: hideBalances })}`}
            </p>
          </div>
        </div>

        {isOverspent ? (
          <Badge variant="striped" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overspent
          </Badge>
        ) : (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {Math.round(utilizationPct)}%
          </Badge>
        )}
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-secondary border border-border/60"
        role="progressbar"
        aria-valuenow={Math.round(clampedWidth)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} budget usage`}
      >
        <motion.div
          initial={prefersReduced ? false : { width: 0 }}
          animate={{ width: `${clampedWidth}%` }}
          transition={{ duration: prefersReduced ? 0 : 0.28, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            isOverspent ? 'bg-foreground pattern-stripes' : 'bg-foreground',
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
        <span className="text-muted-foreground">
          Spent:{' '}
          <strong className="font-semibold text-foreground">
            {formatINR(actualPaise, { hideValue: hideBalances })}
          </strong>
        </span>
        <span className="text-muted-foreground">
          {remainingPaise >= 0 ? 'Remaining: ' : 'Exceeded by: '}
          <strong className="font-semibold text-foreground">
            {formatINR(Math.abs(remainingPaise), { hideValue: hideBalances })}
          </strong>
        </span>
      </div>
    </div>
  );
}
