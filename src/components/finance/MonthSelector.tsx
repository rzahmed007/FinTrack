import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthYear } from '@/types/finance';
import { addMonthsToMonthYear, formatMonthYear } from '@/utils/date';

export interface MonthSelectorProps {
  value: MonthYear;
  onChange: (next: MonthYear) => void;
  compact?: boolean;
  className?: string;
}

export function MonthSelector({
  value,
  onChange,
  compact = false,
  className,
}: MonthSelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-surface p-1',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(addMonthsToMonthYear(value, -1))}
        aria-label="Previous month"
        className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span
        className={cn(
          'px-2.5 text-center font-semibold tracking-tight text-foreground tabular-nums select-none',
          compact ? 'text-xs min-w-[84px]' : 'text-xs sm:text-sm min-w-[124px]',
        )}
      >
        {formatMonthYear(value.year, value.month, compact)}
      </span>
      <button
        type="button"
        onClick={() => onChange(addMonthsToMonthYear(value, 1))}
        aria-label="Next month"
        className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
