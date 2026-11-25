import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();
  const prefersReduced = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed bottom-20 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] flex flex-col gap-2 sm:w-96"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={
              prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }
            }
            transition={{ duration: prefersReduced ? 0 : 0.18 }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-border bg-primary px-4 py-3 text-primary-foreground shadow-elevated"
          >
            <span className="mt-0.5 shrink-0">
              {toast.variant === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : toast.variant === 'error' || toast.variant === 'warning' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs opacity-80 leading-snug">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-full p-1 opacity-75 hover:opacity-100 focus:outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
