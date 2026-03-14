# ⚡ Quick Start - 30 Minute Setup

Get your Summer Shred Tracker live in 30 minutes!

---

## 🎯 What You'll Get

- Live fitness tracking app accessible from any device
- Mobile-optimized PWA (works like a native app)
- Free PostgreSQL database (Supabase)
- Free hosting with auto-deployments (Vercel)
- Custom URL: `https://shred-tracker-xxxx.vercel.app`

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub account ([signup](https://github.com/join))
- [ ] Vercel account ([signup](https://vercel.com/signup))
- [ ] Supabase account ([signup](https://supabase.com))
- [ ] GitHub CLI installed (optional): `brew install gh` (Mac) or download from [cli.github.com](https://cli.github.com)

---

## 🚀 Step-by-Step Setup

### Part 1: Database Setup (10 min)

#### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `shred-tracker`
   - **Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

#### 2. Run Database Migration
1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open `/migrations/0000_init.sql` from your project
4. Copy entire file and paste into SQL editor
5. Click **"Run"** (bottom right)
6. You should see: ✅ **Success. No rows returned**

#### 3. Get Database URL
1. Go to **Settings** → **Database**
2. Scroll to **"Connection String"**
3. Click **"URI"** tab
4. Copy the connection string
5. **Replace** `[YOUR-PASSWORD]` with your database password
6. **Add** `?sslmode=require` to the end

Example:
```
postgresql://postgres.xyz:mypassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

✅ **Save this somewhere - you'll need it in Part 2!**

---

### Part 2: Deploy to Vercel (15 min)

#### 1. Push Code to GitHub

**Option A: Using GitHub CLI (recommended)**
```bash
cd /Users/konstantinborimechkov/Desktop/projects/shred-tracker
git init
git add .
git commit -m "Initial commit - Summer Shred Tracker"
gh repo create shred-tracker --private --source=. --push
```

**Option B: Manual**
1. Go to [github.com/new](https://github.com/new)
2. Create new **private** repository named `shred-tracker`
3. Run these commands:
```bash
cd /Users/konstantinborimechkov/Desktop/projects/shred-tracker
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/shred-tracker.git
git branch -M main
git push -u origin main
```

#### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `shred-tracker` repository
4. Vercel auto-detects settings - leave as is:
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/public`

#### 3. Add Environment Variables

**Before deploying**, expand **"Environment Variables"** and add:

| Name | Value | Example |
|------|-------|---------|
| `DATABASE_URL` | Your Supabase connection string from Part 1 | `postgresql://postgres.xyz:pass@...?sslmode=require` |
| `NODE_ENV` | `production` | `production` |

**IMPORTANT**: Make sure DATABASE_URL includes `?sslmode=require` at the end!

#### 4. Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Click **"Visit"** when done
4. Your app is live! 🎉

Copy your URL: `https://shred-tracker-xxxx.vercel.app`

---

### Part 3: Test on Mobile (5 min)

#### 1. Open on Your Phone
- Open the Vercel URL on your phone's browser
- Bookmark it or continue to step 2

#### 2. Add to Home Screen

**iOS (iPhone/iPad)**:
1. Tap the **Share** button (square with arrow)
2. Scroll down and tap **"Add to Home Screen"**
3. Tap **"Add"**
4. You'll see a "Shred Tracker" icon on your home screen!

**Android**:
1. Tap the **Menu** button (⋮ three dots)
2. Tap **"Add to Home Screen"**
3. Tap **"Add"**
4. Icon appears on your home screen!

#### 3. Test the App
1. Open the app from your home screen
2. Go to **Weight** page → Click **"+ Log Weight"**
3. Enter today's date and your weight
4. Click **"Save"**
5. You should see it appear in the chart! ✅

Try adding entries in:
- Nutrition
- Workouts
- Strength

---

## ✅ Success Checklist

After completing all steps, verify:
- [ ] App loads at your Vercel URL
- [ ] Data persists after refreshing the page
- [ ] Can create entries in all 4 sections
- [ ] Can delete entries
- [ ] Charts display your data
- [ ] App works on mobile
- [ ] Home screen icon works (mobile)

---

## 🎨 Customize Your App (Optional)

### Change Target Weight
Edit `client/src/pages/Dashboard.tsx` and `client/src/pages/WeightPage.tsx`:
```typescript
const WEIGHT_TARGET = 84; // Change to your target weight in kg
const WEIGHT_START = 94;  // Change to your starting weight
```

### Change Nutrition Targets
Edit `client/src/pages/NutritionPage.tsx`:
```typescript
const TARGETS = {
  calories: 2500,  // Daily calorie target
  protein: 210,    // Daily protein in grams
  carbs: 240,      // Daily carbs in grams
  fat: 78          // Daily fat in grams
};
```

### Deploy Updates
After making changes:
```bash
git add .
git commit -m "Updated targets"
git push
```
Vercel will **automatically redeploy** in ~2 minutes!

---

## 🆘 Troubleshooting

### "Database connection error"
- Check DATABASE_URL in Vercel settings
- Make sure it includes `?sslmode=require`
- Verify password is correct

### "App shows no data"
- Migration might not have run
- Go to Supabase → SQL Editor
- Run the migration query again

### "Build failed on Vercel"
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Try redeploying

### "Can't add to home screen"
- Make sure you're using Safari (iOS) or Chrome (Android)
- Some browsers don't support PWA features

---

## 📚 Next Steps

- **Share with friends**: Send them your Vercel URL
- **Add custom domain**: Vercel Settings → Domains
- **Monitor usage**: Check Supabase dashboard for data size
- **Export data**: Supabase → SQL Editor → Export as CSV

---

## 💪 Ready to Track!

You now have a fully functional fitness tracker that:
- ✅ Works on phone, tablet, and desktop
- ✅ Saves all your data securely
- ✅ Updates automatically when you push code
- ✅ Costs $0 to run

**Start logging and crush your goals!** 🔥

---

**Need help?** Check out:
- `DEPLOYMENT.md` for detailed instructions
- `PRODUCTIONIZATION-SUMMARY.md` for technical details
- `README.md` for local development

Good luck with your Summer Shred! 💪
