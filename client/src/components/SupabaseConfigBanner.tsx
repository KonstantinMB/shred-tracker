import { hasSupabase } from "@/lib/supabase";

/**
 * Shows a banner when Supabase is not configured (production).
 * The API was removed — Supabase env vars are required.
 */
export function SupabaseConfigBanner() {
  if (hasSupabase()) return null;
  if (import.meta.env.DEV) return null; // Local dev may use Express

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 text-amber-950 px-4 py-2 text-center text-sm font-medium">
      Add <code className="bg-amber-400/50 px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
      <code className="bg-amber-400/50 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in Vercel → Settings → Environment Variables, then redeploy.
    </div>
  );
}
