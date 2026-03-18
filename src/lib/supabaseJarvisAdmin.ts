import { createClient } from "@supabase/supabase-js";

export function getSupabaseJarvisAdmin() {
  const url = process.env.SUPABASE_JARVIS_URL;
  const serviceRoleKey = process.env.SUPABASE_JARVIS_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return {
      client: null as ReturnType<typeof createClient> | null,
      error: `Missing env vars: ${!url ? "SUPABASE_JARVIS_URL" : ""}${!url && !serviceRoleKey ? ", " : ""}${!serviceRoleKey ? "SUPABASE_JARVIS_SERVICE_ROLE_KEY" : ""}`,
    };
  }

  return {
    client: createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    }) as any,
    error: null as string | null,
  };
}
