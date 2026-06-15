import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "attachments";

export function isStorageConfigured(): boolean {
  return Boolean(url && serviceKey);
}

let cached: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service-role key.
 * NEVER import this into client components.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase storage is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
