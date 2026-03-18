import { createClient } from "@supabase/supabase-js";

export function getSupabaseFunilAdmin() {
  const url = process.env.SUPABASE_FUNIL_URL;
  const serviceRoleKey = process.env.SUPABASE_FUNIL_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return {
      client: null as ReturnType<typeof createClient> | null,
      error: `Missing env vars: ${!url ? "SUPABASE_FUNIL_URL" : ""}${!url && !serviceRoleKey ? ", " : ""}${!serviceRoleKey ? "SUPABASE_FUNIL_SERVICE_ROLE_KEY" : ""}`,
    };
  }

  return {
    // NOTE: we don't ship generated DB types for FUNIL in this repo.
    // Use `any` to keep the build stable.
    client: createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    }) as any,
    error: null as string | null,
  };
}
