import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftAdornment,
      rightAdornment,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

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
        <div className="relative flex items-center">
          {leftAdornment && (
            <span className="pointer-events-none absolute left-3.5 text-muted-foreground">
              {leftAdornment}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full min-h-[44px] rounded-2xl border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftAdornment && 'pl-10',
              rightAdornment && 'pr-11',
              error ? 'border-foreground ring-1 ring-foreground' : 'border-border',
              className,
            )}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute right-2 flex items-center">
              {rightAdornment}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-foreground" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
