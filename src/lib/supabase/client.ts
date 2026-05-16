interface SupabaseSelectResult {
  data: unknown[];
  error: { message: string } | null;
}

export interface SupabaseClient {
  from: (table: string) => {
    select: (cols?: string) => Promise<SupabaseSelectResult>;
  };
}

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return createEmptyClient();

  return {
    from: (table) => ({
      select: async (cols = "*") => {
        const response = await fetch(
          `${url}/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(cols)}`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
          }
        );

        if (!response.ok) {
          return {
            data: [],
            error: { message: await response.text() },
          };
        }

        return { data: (await response.json()) as unknown[], error: null };
      },
    }),
  };
}

function createEmptyClient(): SupabaseClient {
  return {
    from: () => ({
      select: async () => ({ data: [], error: null }),
    }),
  };
}
