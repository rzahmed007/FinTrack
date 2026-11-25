import { useState } from 'react';
import { Check, Database, Shield, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/contexts/ToastContext';
import { isSupabaseConfigured } from '@/repositories/supabaseRepository';
import { formatRupeeInputValue, rupeesToPaise } from '@/utils/currency';

export function SettingsPage() {
  const { user, updateProfile, signOut } = useAuth();
  const { clearAllData } = useFinance();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [openingBalance, setOpeningBalance] = useState(
    formatRupeeInputValue(user?.initialOpeningBalancePaise ?? 0),
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim() || 'FinTrack User',
        initialOpeningBalancePaise: rupeesToPaise(openingBalance),
      });
      showToast({
        variant: 'success',
        title: 'Settings saved',
        description: 'Profile and opening balance updated.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      setOpeningBalance('');
      setClearConfirmOpen(false);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace Preferences
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Settings
        </h2>
      </div>

      {/* Profile & Opening Balance */}
      <section className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Account & Opening Balance
          </h3>
          <p className="text-xs text-muted-foreground">
            Timezone locked to Asia/Kolkata • Currency formatted in INR (en-IN)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <CurrencyInput
            label="Initial Opening Balance"
            value={openingBalance}
            onChange={setOpeningBalance}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            to="/budget"
            className="text-xs font-semibold underline underline-offset-4 text-foreground"
          >
            Edit Monthly Salary & Fixed Payments Plan →
          </Link>
          <Button
            onClick={handleSaveProfile}
            isLoading={savingProfile}
            leftIcon={<Check className="h-4 w-4" />}
          >
            Save Preferences
          </Button>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Monochrome Theme
          </h3>
          <p className="text-xs text-muted-foreground">
            Switch between crisp Light (#FFFFFF) and Deep Dark (#0A0A0A)
          </p>
        </div>
        <ThemeToggle showLabel />
      </section>

      {/* LocalStorage Controls */}
      <section className="rounded-[24px] border border-border bg-surface p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                LocalStorage Persistence
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All transactions, budgets, EMIs, categories, and savings goals
                are stored locally in browser{' '}
                <code className="font-semibold text-foreground">
                  localStorage
                </code>
                .
              </p>
            </div>
          </div>
          <Badge variant="outline">
            {isSupabaseConfigured() ? 'Supabase Ready' : 'LocalStorage Mode'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => setClearConfirmOpen(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Clear All Local Data
          </Button>

          <Button
            variant="danger"
            onClick={() => void signOut()}
            leftIcon={<Shield className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      </section>

      <ConfirmationDialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleClearData}
        isLoading={isClearing}
        title="Clear All Local Data?"
        description="This will permanently clear all transactions, budget settings, EMI schedules, and savings goals from localStorage so you can start fresh."
        confirmLabel="Clear Everything"
      />
    </div>
  );
}
