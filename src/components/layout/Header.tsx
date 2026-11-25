import { useMemo, useState } from 'react';
import {
  Bell,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  User,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MonthSelector } from '@/components/finance/MonthSelector';
import { PAGE_TITLES } from '@/components/layout/navigation';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { formatINR } from '@/utils/currency';
import { getMonthKeyFromDate, toMonthKey } from '@/utils/date';

export interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    selectedMonthYear,
    setSelectedMonthYear,
    openQuickAdd,
    budgetConfig,
    monthTransactions,
    emis,
    hideBalances,
  } = useFinance();

  const [remindersOpen, setRemindersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'FinTrack';
  const monthKey = toMonthKey(selectedMonthYear.year, selectedMonthYear.month);

  const upcomingReminders = useMemo(() => {
    const paidFixedCategories = new Set(
      monthTransactions
        .filter((t) => t.type === 'expense')
        .map((t) => t.categoryId),
    );

    const unpaidPlanned = budgetConfig.plannedFixedPayments
      .filter((fp) => fp.active && !paidFixedCategories.has(fp.categoryId))
      .map((fp) => ({
        id: fp.id,
        label: fp.label,
        amountPaise: fp.amountPaise,
        dueDay: fp.dueDay,
      }));

    const unpaidEmis = emis
      .filter(
        (emi) =>
          emi.status === 'active' &&
          !emi.payments.some((p) => p.installmentKey === monthKey) &&
          !monthTransactions.some(
            (tx) =>
              tx.emiId === emi.id &&
              getMonthKeyFromDate(tx.date) === monthKey,
          ),
      )
      .filter((emi) => !unpaidPlanned.some((p) => p.label === emi.name));

    return {
      items: unpaidPlanned,
      count: unpaidPlanned.length + unpaidEmis.length,
    };
  }, [budgetConfig.plannedFixedPayments, monthTransactions, emis, monthKey]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md safe-pt">
      <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        {/* Left: Sidebar toggle + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          {/* Mobile brand mark */}
          <div className="flex md:hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-extrabold">
            FT
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base sm:text-xl font-extrabold tracking-tight text-foreground">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right: MonthSelector, Add button, Reminders, Theme (mobile), Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block">
            <MonthSelector
              value={selectedMonthYear}
              onChange={setSelectedMonthYear}
            />
          </div>
          <div className="sm:hidden">
            <MonthSelector
              value={selectedMonthYear}
              onChange={setSelectedMonthYear}
              compact
            />
          </div>

          <Button
            onClick={() => openQuickAdd({ type: 'expense' })}
            size="sm"
            className="hidden sm:inline-flex"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Transaction
          </Button>

          {/* Reminders popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setRemindersOpen((o) => !o);
                setProfileOpen(false);
              }}
              aria-label="Payment reminders"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              <Bell className="h-4 w-4" />
              {upcomingReminders.count > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full bg-foreground ring-2 ring-surface" />
              )}
            </button>

            {remindersOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-[20px] border border-border bg-surface p-4 shadow-elevated z-40">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pending Fixed Payments
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {upcomingReminders.items.length}
                  </span>
                </div>
                {upcomingReminders.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    All planned fixed payments for {monthKey} are recorded.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {upcomingReminders.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/50 px-3 py-2 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Due day {item.dueDay}
                          </p>
                        </div>
                        <span className="font-bold text-foreground tabular-nums">
                          {formatINR(item.amountPaise, {
                            hideValue: hideBalances,
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => {
                    setRemindersOpen(false);
                    navigate('/budget');
                  }}
                >
                  View Monthly Budget
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <ThemeToggle />
          </div>

          {/* Desktop Profile Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((o) => !o);
                setRemindersOpen(false);
              }}
              aria-label="Open profile menu"
              className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface pl-1.5 pr-3 text-xs font-bold text-foreground transition-colors hover:bg-surface-hover"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {(user?.name ?? 'AR')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="hidden lg:inline max-w-[110px] truncate">
                {user?.name ?? 'Profile'}
              </span>
              <Menu className="h-3.5 w-3.5 text-muted-foreground lg:hidden" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-[20px] border border-border bg-surface p-2 shadow-elevated z-40">
                <div className="border-b border-border px-3 py-2 mb-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-hover"
                >
                  <User className="h-3.5 w-3.5" />
                  Profile & Modules
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-hover"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    void signOut();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-hover"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
