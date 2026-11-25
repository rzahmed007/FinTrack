import React from 'react';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  rightSlot,
  children,
  footer,
  className,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark flex flex-col',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      <div className="flex-1 min-h-[220px] w-full">{children}</div>

      {footer && (
        <div className="mt-4 border-t border-border pt-3">{footer}</div>
      )}
    </section>
  );
}
