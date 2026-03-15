# Supabase Setup (Shred Tracker)

The app now uses **Supabase directly from the frontend** — no Vercel serverless API.

## 1. Get Supabase credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Settings** → **API**
3. Copy:
   - **Project URL** (e.g. `https://xxx.supabase.co`)
   - **anon public** key

## 2. Run migrations

In Supabase **SQL Editor**, run these in order:

1. `migrations/0000_init.sql`
2. `migrations/0001_user_profile.sql`
3. `migrations/0002_remove_waist.sql`
4. `migrations/0003_exercises.sql`
5. `migrations/0004_rls_anon.sql`

## 3. Set Vercel environment variables

In Vercel → **Project** → **Settings** → **Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Project URL (e.g. `https://wuqutbuobxpfczzfcneb.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your anon public key |

Redeploy after adding these.

## 4. Local development

Create `.env` in the project root:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

For local dev with the Express server (optional), also set `DATABASE_URL`.
