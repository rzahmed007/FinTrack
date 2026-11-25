import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'type' | 'size'
  > {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  size?: 'md' | 'hero';
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(
  (
    {
      value,
      onChange,
      label,
      error,
      size = 'md',
      className,
      id,
      placeholder = '0',
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow digits and at most one decimal point with 2 decimal digits
      const sanitized = raw.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) return;
      if (parts[1] && parts[1].length > 2) {
        onChange(`${parts[0]}.${parts[1].slice(0, 2)}`);
        return;
      }
      onChange(sanitized);
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'relative flex items-center rounded-2xl border bg-surface transition-colors duration-150',
            'focus-within:ring-2 focus-within:ring-foreground focus-within:border-transparent',
            error ? 'border-foreground ring-1 ring-foreground' : 'border-border',
            size === 'hero' ? 'min-h-[64px] px-5' : 'min-h-[44px] px-4',
          )}
        >
          <span
            className={cn(
              'select-none font-bold text-muted-foreground mr-2 tabular-nums',
              size === 'hero' ? 'text-2xl sm:text-3xl' : 'text-base',
            )}
          >
            ₹
          </span>
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={cn(
              'w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none tabular-nums',
              size === 'hero'
                ? 'text-3xl sm:text-4xl font-extrabold tracking-tight py-2'
                : 'text-sm font-semibold py-2',
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

CurrencyInput.displayName = 'CurrencyInput';
