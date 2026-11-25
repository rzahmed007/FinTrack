import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground border border-transparent hover:opacity-90 active:scale-[0.98]',
  secondary:
    'bg-surface-secondary text-foreground border border-border hover:bg-surface-hover active:scale-[0.98]',
  outline:
    'bg-transparent text-foreground border border-border hover:bg-surface-hover active:scale-[0.98]',
  ghost:
    'bg-transparent text-foreground border border-transparent hover:bg-surface-hover active:scale-[0.98]',
  danger:
    'bg-transparent text-foreground border border-foreground/40 hover:bg-foreground hover:text-background active:scale-[0.98]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] sm:min-h-[38px] px-4 text-xs font-semibold',
  md: 'min-h-[44px] px-5 text-sm font-semibold',
  lg: 'min-h-[48px] px-6 text-base font-semibold',
  icon: 'h-11 w-11 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-all duration-150 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-45 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
