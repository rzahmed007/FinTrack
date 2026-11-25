import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_USER } from '@/data/demoData';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  rememberMe: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEMO_USER.email,
      password: 'demo-user',
      rememberMe: true,
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: LoginValues) => {
    await new Promise((r) => setTimeout(r, 250));
    await signIn(values);
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
      {/* Desktop Monochrome Branding Panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-black text-white p-12 border-r border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black font-extrabold text-base tracking-tighter">
              FT
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">FinTrack</p>
              <p className="text-xs text-white/65">Track. Manage. Save.</p>
            </div>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
            Personal Edition
          </span>
        </div>

        <div className="max-w-md space-y-6">
          <h2 className="text-4xl font-extrabold tracking-tight leading-[1.15]">
            Clarity over every rupee you earn, commit, and spend.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Built for single-user personal finance: separate fixed family
            commitments and EMIs from daily personal spending, track support
            received from parents, and know your safe daily allowance in
            seconds.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-[20px] border border-white/15 bg-white/5 p-4">
              <p className="text-xs text-white/60">Default Salary Plan</p>
              <p className="mt-1 text-xl font-extrabold tabular-nums">₹15,000</p>
            </div>
            <div className="rounded-[20px] border border-white/15 bg-white/5 p-4">
              <p className="text-xs text-white/60">Daily Entry Speed</p>
              <p className="mt-1 text-xl font-extrabold tabular-nums">5–10 sec</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/50">
          Phase 1 Frontend Demo • LocalStorage persistence • Ready for Supabase Auth
        </p>
      </aside>

      {/* Login Form Column */}
      <main className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm">
              FT
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight">FinTrack</p>
              <p className="text-[11px] text-muted-foreground">
                Track. Manage. Save.
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md py-10 space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-semibold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Single-User Private Workspace
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground pt-2">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your FinTrack ledger and monthly budgets.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-secondary/70 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            <strong className="font-bold text-foreground">
              Demo Authentication (Phase 1):
            </strong>{' '}
            This frontend preview uses a local demo session stored in your
            browser. No real passwords are stored, and Phase 2 replaces this
            with Supabase Auth.
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leftAdornment={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter password"
              leftAdornment={<Lock className="h-4 w-4" />}
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer select-none min-h-[44px]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-black dark:accent-white"
                  {...register('rememberMe')}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="min-h-[44px] px-2 text-sm font-semibold text-foreground underline underline-offset-4 hover:opacity-75"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="w-full"
            >
              Sign In to FinTrack
            </Button>
          </form>
        </div>

        <p className="text-center lg:text-left text-xs text-muted-foreground">
          Private single-user application — public registration is disabled.
        </p>
      </main>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Password Recovery (Demo Mode)"
        description="Information about authentication in Phase 1."
      >
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            FinTrack is currently running in <strong className="text-foreground">Phase 1 Demo Mode</strong> using local browser storage. Any password of at least 4 characters works with the demo form.
          </p>
          <p>
            When Supabase Auth is connected in Phase 2, this action will trigger a secure password-reset email flow.
          </p>
          <Button className="w-full" onClick={() => setForgotOpen(false)}>
            Got it
          </Button>
        </div>
      </Modal>
    </div>
  );
}
