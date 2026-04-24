import { createClient } from "@supabase/supabase-js";

// Canonical environment variable names used by Supabase/Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // For this app, these are critical for core functionality
  throw new Error(
    "[Supabase] Missing critical environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY must be set."
  );
}

/**
 * Singleton Supabase client for use throughout the application.
 * Handles authentication persistence and auto-refresh by default.
 */
export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
