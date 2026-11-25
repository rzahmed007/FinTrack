import { motion, useReducedMotion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SIDEBAR_NAV_GROUPS } from '@/components/layout/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user, signOut } = useAuth();
  const prefersReduced = useReducedMotion();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: prefersReduced ? 0 : 0.22, ease: 'easeInOut' }}
      className="hidden md:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-border bg-surface select-none overflow-hidden"
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-base tracking-tighter">
          FT
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-base font-extrabold tracking-tight text-foreground leading-none">
              FinTrack
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground truncate">
              Track. Manage. Save.
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {SIDEBAR_NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[44px] items-center gap-3 rounded-full px-3.5 text-sm font-semibold transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Footer: Theme, Profile & Logout */}
      <div className="shrink-0 border-t border-border p-3 space-y-2.5">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground">
              Appearance
            </span>
          )}
          <ThemeToggle />
        </div>

        <div
          className={cn(
            'flex items-center gap-2.5 rounded-2xl border border-border bg-surface-secondary/70 p-2',
            collapsed && 'justify-center',
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {(user?.name ?? 'AR')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">
                {user?.name ?? 'User'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email ?? ''}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
