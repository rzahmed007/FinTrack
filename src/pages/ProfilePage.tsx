import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  ChevronRight,
  LogOut,
  PiggyBank,
  Settings,
  Tags,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const MODULE_LINKS = [
  {
    title: 'Income',
    subtitle: 'Salary, parent support & additional income',
    path: '/income',
    icon: ArrowDownLeft,
  },
  {
    title: 'Expenses',
    subtitle: 'Fixed commitments & daily personal spending',
    path: '/expenses',
    icon: ArrowUpRight,
  },
  {
    title: 'Monthly Budget',
    subtitle: 'Planned ₹15,000 budget & daily allowance',
    path: '/budget',
    icon: Wallet,
  },
  {
    title: 'EMI Management',
    subtitle: 'AC EMI installments & duplicate-safe tracking',
    path: '/emi',
    icon: CalendarClock,
  },
  {
    title: 'Savings',
    subtitle: 'Goal reserves separated from expenses',
    path: '/savings',
    icon: PiggyBank,
  },
  {
    title: 'Reports',
    subtitle: 'Daily, weekly, monthly, yearly & CSV export',
    path: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Categories',
    subtitle: 'Manage income & expense classifications',
    path: '/categories',
    icon: Tags,
  },
  {
    title: 'Settings',
    subtitle: 'Preferences, opening balance & demo reset',
    path: '/settings',
    icon: Settings,
  },
];

export function ProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* User Identity Card */}
      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card dark:shadow-card-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-extrabold">
            {(user?.name ?? 'AR')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-foreground">
                {user?.name ?? 'FinTrack User'}
              </h2>
              <Badge variant="outline">LocalStorage</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle showLabel />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void signOut()}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      </section>

      {/* All Modules Directory (Critical for Mobile Navigation) */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          All FinTrack Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULE_LINKS.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {mod.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
