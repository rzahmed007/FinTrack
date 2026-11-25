import * as React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTodayIST } from '@/utils/date';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  showQuickToday?: boolean;
  onQuickSelect?: (dateStr: string) => void;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      className,
      label,
      error,
      showQuickToday = false,
      onQuickSelect,
      id,
      value,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const today = getTodayIST();

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {label}
            </label>
          )}
          {showQuickToday && onQuickSelect && value !== today && (
            <button
              type="button"
              onClick={() => onQuickSelect(today)}
              className="text-xs font-semibold underline underline-offset-2 text-muted-foreground hover:text-foreground"
            >
              Set Today
            </button>
          )}
        </div>
        <div className="relative flex items-center">
          <Calendar
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={ref}
            id={inputId}
            type="date"
            value={value}
            className={cn(
              'w-full min-h-[44px] rounded-2xl border bg-surface pl-10 pr-4 py-2.5 text-sm font-medium text-foreground tabular-nums',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent',
              error ? 'border-foreground ring-1 ring-foreground' : 'border-border',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-foreground" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
