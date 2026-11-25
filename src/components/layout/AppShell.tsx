import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { QuickTransactionModal } from '@/components/forms/QuickTransactionModal';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastViewport } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const prefersReduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar collapsed={sidebarCollapsed} />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200',
          sidebarCollapsed ? 'md:pl-[80px]' : 'md:pl-[260px]',
        )}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />

        <main className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-6 md:pb-10 lg:px-8">
          <motion.div
            key={location.pathname}
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.18, ease: 'easeOut' }}
            className="mx-auto max-w-7xl w-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <MobileNav />
      <QuickTransactionModal />
      <ToastViewport />
    </div>
  );
}
