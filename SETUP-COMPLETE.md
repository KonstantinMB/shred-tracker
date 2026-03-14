# ✅ Shred Tracker — Setup Complete

Setup was performed using Supabase MCP and Vercel CLI. Here's what was done and what you need to do next.

---

## What Was Done

### 1. Supabase Database ✅
- **Migration applied** to your existing Supabase project (`vsichkolov` / `wuqutbuobxpfczzfcneb`)
- Tables created: `weight_logs`, `workout_logs`, `nutrition_logs`, `strength_logs`
- **Note**: A new Supabase project could not be created because you've reached the free tier limit (2 projects). The shred-tracker tables were added to your existing project instead—they use separate table names and won't conflict.

### 2. Vercel Deployment ✅
- **Project**: `shred-tracker` (linked to `konstantinmbs-projects`)
- **Production URL**: https://shred-tracker-hazel.vercel.app (or check [Vercel Dashboard](https://vercel.com/konstantinmbs-projects/shred-tracker))
- **Git**: Initial commit created, `.vercel` folder added for deployment link

---

## ⚠️ One Step Left: Add DATABASE_URL

Right now the app runs in **in-memory mode** (data resets on each cold start). To persist data to Supabase:

### 1. Get your Supabase database password
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → select project **vsichkolov**
2. **Settings** → **Database**
3. Under **Connection string**, select **URI** tab
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password

### 2. Build the connection string
Format:
```
postgresql://postgres.wuqutbuobxpfczzfcneb:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 3. Add to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/konstantinmbs-projects/shred-tracker/settings/environment-variables)
2. Add environment variable:
   - **Name**: `DATABASE_URL`
   - **Value**: (your full connection string from step 2)
   - **Environment**: Production (and Preview if you want)
3. **Redeploy**: Deployments → ⋮ on latest → Redeploy

---

## Optional: Push to GitHub

To enable automatic deployments on `git push`:

```bash
cd /Users/konstantinborimechkov/Desktop/projects/shred-tracker

# Login to GitHub CLI (if not already)
gh auth login

# Create repo and push
gh repo create shred-tracker --private --source=. --push
```

Then in Vercel: **Settings** → **Git** → Connect your GitHub repository.

---

## Summary

| Item | Status |
|------|--------|
| Supabase tables | ✅ Created in vsichkolov project |
| Vercel deployment | ✅ Live |
| DATABASE_URL | ⏳ Add in Vercel (see above) |
| GitHub (optional) | ⏳ Run `gh auth login` + `gh repo create` |

---

**App URL**: https://shred-tracker-hazel.vercel.app
