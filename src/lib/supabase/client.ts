// Placeholder Supabase client — wired up in a later phase.
// Keeps the import path stable so we can add real implementation later
// without touching call sites.

export interface SupabaseClientStub {
  from: (table: string) => {
    select: (cols?: string) => Promise<{ data: unknown[]; error: null }>;
  };
}

export function getSupabaseClient(): SupabaseClientStub {
  return {
    from: () => ({
      select: async () => ({ data: [], error: null }),
    }),
  };
}
