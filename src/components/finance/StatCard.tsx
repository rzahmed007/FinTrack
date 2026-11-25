import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  emphasized?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  badge,
  emphasized = false,
  className,
}: StatCardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.2 }}
      className={cn(
        'rounded-[24px] border border-border bg-surface p-5 shadow-card dark:shadow-card-dark transition-colors',
        emphasized && 'border-foreground/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-foreground">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {badge && (
          <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] font-semibold text-foreground whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
