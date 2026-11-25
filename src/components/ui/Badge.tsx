import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'solid' | 'outline' | 'striped';

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap',
        variant === 'default' && 'bg-surface-secondary text-foreground border border-border',
        variant === 'solid' && 'bg-primary text-primary-foreground',
        variant === 'outline' && 'border border-foreground/40 text-foreground bg-transparent',
        variant === 'striped' && 'border border-foreground/50 text-foreground pattern-stripes',
        className,
      )}
    >
      {children}
    </span>
  );
}
