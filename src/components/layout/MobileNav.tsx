import { Home, ListOrdered, Plus, User, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const { openQuickAdd } = useFinance();

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-col items-center justify-center gap-1 min-h-[48px] min-w-[52px] rounded-2xl px-2 text-[11px] font-semibold transition-colors',
      isActive ? 'text-foreground font-bold' : 'text-muted-foreground',
    );

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md safe-pb"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2 py-1.5">
        <NavLink to="/dashboard" className={itemClass}>
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/transactions" className={itemClass}>
          <ListOrdered className="h-5 w-5" />
          <span>Activity</span>
        </NavLink>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => openQuickAdd({ type: 'expense' })}
            aria-label="Quick add transaction"
            className="flex h-12 w-12 -mt-4 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-elevated transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <NavLink to="/budget" className={itemClass}>
          <Wallet className="h-5 w-5" />
          <span>Budget</span>
        </NavLink>

        <NavLink to="/profile" className={itemClass}>
          <User className="h-5 w-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
