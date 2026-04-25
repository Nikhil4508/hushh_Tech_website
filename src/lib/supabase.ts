import { createClient } from "@supabase/supabase-js";

// Canonical environment variable names used by Supabase/Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Graceful fallback or error depending on app requirements
  // For this app, these are critical for core functionality
  console.warn(
    "[Supabase] Missing environment variables. Some features may not work."
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
