import { createClient as _createClient, SupabaseClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------
// Browser client — singleton, uses NEXT_PUBLIC_ keys.
// Safe to call from Server Components, Client Components, and API routes.
// ----------------------------------------------------------------
let _browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!_browserClient) {
    _browserClient = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _browserClient;
}

// ----------------------------------------------------------------
// Admin client — new instance per call, uses the service role key.
// Must ONLY be called from server-side code (API routes, Server Actions,
// Server Components). Will throw at runtime if called in the browser.
// ----------------------------------------------------------------
export function createAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "[supabase] createAdminClient() must only be called on the server. " +
        "The service role key must never be exposed to the browser."
    );
  }

  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
