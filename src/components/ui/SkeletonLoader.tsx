import { cn } from '@/lib/utils';

export interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-surface-secondary',
        className,
      )}
    />
  );
}

export function SkeletonLoader({ className, lines = 3 }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-border bg-surface p-5 space-y-3',
        className,
      )}
      aria-busy="true"
      aria-label="Loading content"
    >
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-8 w-1/2" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <SkeletonBlock
            key={idx}
            className={cn('h-3', idx === lines - 1 ? 'w-2/3' : 'w-full')}
          />
        ))}
      </div>
    </div>
  );
}
