/**
 * Supabase browser client factory.
 *
 * createBrowserClient from @supabase/ssr handles cookie-based session
 * persistence automatically for Next.js App Router, including server
 * component access via createServerClient (separate usage in API routes).
 *
 * Import `supabase` (the singleton) in client components and hooks.
 * Import `createClient` only when you need a fresh instance (e.g., tests).
 */

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[FormPilot] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
    "Auth and data features will not work until you add real credentials to .env.local"
  );
}

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);

// Singleton for use in client components
export const supabase = createClient();
