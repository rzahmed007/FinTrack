import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
}: DrawerProps) {
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
          className="fixed inset-0 z-50 flex justify-end"
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
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={prefersReduced ? { x: 0 } : { x: '100%' }}
            animate={{ x: 0 }}
            exit={prefersReduced ? { x: 0 } : { x: '100%' }}
            transition={{ duration: prefersReduced ? 0 : 0.24, ease: 'easeOut' }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-surface p-6 shadow-elevated overflow-y-auto"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close drawer"
                className="-mr-2 -mt-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
