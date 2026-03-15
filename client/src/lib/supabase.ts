import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — using in-memory fallback");
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function hasSupabase() {
  return !!supabase;
}
