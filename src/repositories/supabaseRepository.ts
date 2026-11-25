import type { IDataRepositorySet } from '@/repositories/interfaces';
import { createLocalStorageRepositories } from '@/repositories/localStorageRepository';

/**
 * Phase 2 Supabase Integration Scaffold
 * -------------------------------------
 * When integrating Supabase in Phase 2:
 * 1. Install @supabase/supabase-js and configure VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
 * 2. Implement SupabaseAuthRepository, SupabaseTransactionRepository, SupabaseBudgetRepository,
 *    SupabaseEMIRepository, and SupabaseSavingsRepository matching IDataRepositorySet.
 * 3. Switch `getActiveRepositories()` below based on environment configuration.
 *
 * UI pages, calculation engine, and contexts require zero redesign.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

export function getActiveRepositories(): IDataRepositorySet {
  // Phase 1 always uses LocalStorage demonstration repositories.
  return createLocalStorageRepositories();
}
