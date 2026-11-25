import { MotionConfig } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/contexts/AuthContext';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { BudgetPage } from '@/pages/BudgetPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EMIPage } from '@/pages/EMIPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { IncomePage } from '@/pages/IncomePage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SavingsPage } from '@/pages/SavingsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TransactionsPage } from '@/pages/TransactionsPage';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <FinanceProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route
                        path="/transactions"
                        element={<TransactionsPage />}
                      />
                      <Route path="/income" element={<IncomePage />} />
                      <Route path="/expenses" element={<ExpensesPage />} />
                      <Route path="/budget" element={<BudgetPage />} />
                      <Route path="/emi" element={<EMIPage />} />
                      <Route path="/savings" element={<SavingsPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
            </FinanceProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}

export default App;
