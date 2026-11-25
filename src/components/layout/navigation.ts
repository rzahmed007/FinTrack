import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  ListOrdered,
  PiggyBank,
  Settings,
  Tags,
  Wallet,
} from 'lucide-react';
import type React from 'react';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const SIDEBAR_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Transactions', path: '/transactions', icon: ListOrdered },
      { label: 'Income', path: '/income', icon: ArrowDownLeft },
      { label: 'Expenses', path: '/expenses', icon: ArrowUpRight },
      { label: 'Monthly Budget', path: '/budget', icon: Wallet },
      { label: 'EMI Management', path: '/emi', icon: CalendarClock },
      { label: 'Savings', path: '/savings', icon: PiggyBank },
    ],
  },
  {
    title: 'Insights',
    items: [{ label: 'Reports', path: '/reports', icon: BarChart3 }],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Categories', path: '/categories', icon: Tags },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/income': 'Income',
  '/expenses': 'Expenses',
  '/budget': 'Monthly Budget',
  '/emi': 'EMI Management',
  '/savings': 'Savings',
  '/reports': 'Reports',
  '/categories': 'Categories',
  '/settings': 'Settings',
  '/profile': 'Profile & Menu',
};
