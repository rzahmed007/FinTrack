import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
}: BottomSheetProps) {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <motion.div
            initial={prefersReduced ? { y: 0 } : { y: '100%' }}
            animate={{ y: 0 }}
            exit={prefersReduced ? { y: 0 } : { y: '100%' }}
            transition={{ duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full rounded-t-[28px] border-t border-border bg-surface px-5 pt-3 pb-6 safe-pb shadow-elevated max-h-[92vh] overflow-y-auto"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
            {(title || description) && (
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  {title && (
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close sheet"
                  className="-mr-2 -mt-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
