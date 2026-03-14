# 🚀 Production Deployment Guide

Complete step-by-step guide to deploy your Summer Shred Tracker to production using **Supabase** (database) and **Vercel** (hosting).

---

## Prerequisites

- GitHub account
- Vercel account (free tier) - [vercel.com/signup](https://vercel.com/signup)
- Supabase account (free tier) - [supabase.com](https://supabase.com)

---

## Part 1: Set Up Supabase Database (5 minutes)

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Project Name**: `shred-tracker` (or any name you like)
   - **Database Password**: Create a strong password (save this - you'll need it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free (sufficient for personal use)
4. Click **"Create new project"** (takes ~2 minutes to provision)

### Step 2: Run Database Migration

Once your project is ready:

1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `/migrations/0000_init.sql` from your project
4. Paste it into the SQL editor
5. Click **"Run"** (bottom right)
6. You should see: ✓ Success. No rows returned

### Step 3: Get Your Database Connection String

1. In Supabase, go to **Settings** (gear icon in left sidebar)
2. Click **"Database"** in the settings menu
3. Scroll down to **"Connection String"**
4. Select **"URI"** tab (not Transaction)
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with the database password you created in Step 1
7. **Add `?sslmode=require`** to the end:
   ```
   postgresql://postgres.xxx:yourpassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
8. **Save this connection string** - you'll need it for Vercel!

---

## Part 2: Deploy to Vercel (10 minutes)

### Step 1: Push Code to GitHub

If you haven't already pushed your code to GitHub:

```bash
cd /Users/konstantinborimechkov/Desktop/projects/shred-tracker

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Summer Shred Tracker"

# Create GitHub repo and push (using GitHub CLI)
gh repo create shred-tracker --private --source=. --push

# OR manually:
# 1. Go to github.com and create a new private repository named 'shred-tracker'
# 2. Run these commands:
git remote add origin https://github.com/YOUR_USERNAME/shred-tracker.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your **`shred-tracker`** repository
4. Vercel will auto-detect settings - you should see:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`

### Step 3: Add Environment Variables

**Before clicking Deploy**, expand **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Supabase connection string from Part 1, Step 3 |
| `NODE_ENV` | `production` |

**Important**: Make sure to paste the FULL connection string including `?sslmode=require`

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Once done, you'll see: 🎉 **Congratulations!**
4. Click **"Visit"** to open your app

Your app is now live at: `https://shred-tracker-xxxx.vercel.app`

### Step 5: Test on Mobile

1. Open the URL on your phone's browser
2. Add to Home Screen:
   - **iOS**: Tap Share → Add to Home Screen
   - **Android**: Tap Menu (⋮) → Add to Home Screen
3. Your app will now work like a native app!

---

## Part 3: Verify Everything Works

### Test CRUD Operations

1. **Weight Tracking**:
   - Navigate to "Weight" page
   - Click "+ Log Weight"
   - Enter today's date and weight
   - Click "Save" → ✓ Entry should appear in the chart

2. **Nutrition Logging**:
   - Go to "Nutrition" page
   - Click "+ Log Nutrition"
   - Fill in macros (calories, protein, carbs, fat)
   - Optionally add steps, water, sleep
   - Click "Save" → ✓ Should show in heatmap

3. **Workouts**:
   - Go to "Workouts" page
   - Click "+ Log Workout"
   - Select type (gym/tennis/jump rope/recovery)
   - Enter duration and energy rating
   - Click "Save" → ✓ Should appear in calendar

4. **Strength PRs**:
   - Go to "Strength" page
   - Click "+ Log Session"
   - Enter weights for lifts
   - Click "Save" → ✓ Should show in list

5. **Delete Operations**:
   - Try deleting an entry by clicking the trash icon
   - Confirm deletion → ✓ Entry should disappear

### Verify Database Persistence

1. Close your browser completely
2. Open the app again
3. All your data should still be there ✓

---

## Part 4: Custom Domain (Optional)

### Add Your Own Domain

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `shred.yourdomain.com`)
4. Follow Vercel's DNS setup instructions
5. Wait 5-10 minutes for DNS propagation
6. Your app will be live at your custom domain!

---

## Maintenance & Updates

### How to Update Your App

Whenever you make changes to your code:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel will **automatically rebuild and deploy** your changes in ~2 minutes!

### View Deployment Logs

If something goes wrong:
1. Go to Vercel dashboard → your project
2. Click "Deployments" tab
3. Click on the latest deployment
4. Check the build logs for errors

### Database Backups

Supabase automatically backs up your database daily on the free tier. To manually backup:
1. Supabase Dashboard → Database → Backups
2. Click "Create backup"

---

## Troubleshooting

### Build fails on Vercel

**Error**: `DATABASE_URL is not defined`
- **Fix**: Go to Vercel → Settings → Environment Variables → Add `DATABASE_URL`

**Error**: Build timeout or out of memory
- **Fix**: This shouldn't happen with this project. Contact Vercel support.

### App loads but shows "No data"

**Possible causes**:
1. Database migration didn't run → Go back to Part 1, Step 2
2. Wrong DATABASE_URL → Check Vercel environment variables
3. Database connection blocked → Make sure connection string includes `?sslmode=require`

### Mobile app doesn't update after changes

**Fix**:
1. Delete the home screen icon
2. Clear browser cache
3. Visit the Vercel URL again
4. Re-add to home screen

### Data not saving

1. Open browser console (F12) → Check for errors
2. Verify DATABASE_URL in Vercel is correct
3. Check Supabase dashboard → Logs for database errors

---

## Performance Tips

1. **Enable Preview Deployments**: Vercel creates preview URLs for every git branch - test changes before merging to main
2. **Monitor Database Usage**: Free tier has limits - check Supabase dashboard
3. **Add Analytics** (optional): Vercel → Settings → Analytics (free for hobbyists)

---

## Security Checklist

✓ Database password is strong and not shared
✓ GitHub repository is private
✓ `DATABASE_URL` is only in Vercel environment variables (never committed to git)
✓ Supabase RLS (Row Level Security) not needed for personal app, but can be added

---

## What's Next?

- **Add friends**: Share your Vercel URL with friends/coach to show progress
- **Customize**: Edit colors, add more metrics, change targets
- **Backup data**: Periodically export from Supabase SQL Editor
- **Scale**: Free tiers support 500MB storage (Supabase) + unlimited bandwidth (Vercel)

---

**🎉 You're all set!** Your fitness tracker is now production-ready and accessible from anywhere.

For questions or issues, check the main README.md or create a GitHub issue.
