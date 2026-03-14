# 🏋️ Summer Shred Tracker

A personal fitness progress tracker built for Konstantin's 12-week Summer Shred (March → June 2026).
Dark athletic theme · Electric cyan accent · Mobile-first · PWA-ready · Production-ready.

## 🚀 Quick Links

- **[⚡ Quick Start Guide](QUICK-START.md)** - Get live in 30 minutes!
- **[📘 Deployment Guide](DEPLOYMENT.md)** - Detailed Supabase + Vercel setup
- **[📊 Productionization Summary](PRODUCTIONIZATION-SUMMARY.md)** - What was done & technical details

## Features

- **Dashboard** — KPI cards (weight trend, weekly workouts, calories, protein), progress rings, charts
- **Weight** — Log daily weight, track trend vs. 84 kg target, 28-day chart
- **Nutrition** — Log macros (kcal / protein / carbs / fat), weekly heatmap
- **Workouts** — Log gym / tennis / jump rope / recovery sessions, monthly heatmap calendar
- **Strength** — Track PRs for Bench Press, Barbell Row, Leg Press

---

## Local Development

### Prerequisites

- Node.js 18+ and npm
- (Optional) A PostgreSQL database for persistent storage — see **Database Setup** below

### Install & Run

```bash
git clone <your-repo-url>
cd shred-tracker
npm install
cp .env.example .env        # edit DATABASE_URL if you have one
npm run dev                 # starts on http://localhost:5000
```

Without `DATABASE_URL`, the app runs entirely in-memory with seeded demo data (28 days of weight/nutrition/workout history). Perfect for testing.

---

## Database Setup (PostgreSQL)

### Option A — Neon (Recommended Free Tier)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the **Connection String** (postgresql://...)
3. Paste it as `DATABASE_URL` in your `.env`
4. Run the migration:

```bash
npm run db:push
```

Or paste the contents of `migrations/0000_init.sql` directly into the Neon SQL editor.

### Option B — Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection String** (URI format)
3. Set `DATABASE_URL` in `.env`, then `npm run db:push`

### Option C — Vercel Postgres

Add the database from the Vercel dashboard (see **Vercel Deployment** step 4 below) — it auto-populates `DATABASE_URL` for you.

---

## Vercel Deployment

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create shred-tracker --private --source=. --push
# or: git remote add origin <your-github-url> && git push -u origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select `shred-tracker`
3. Vercel auto-detects the project. Leave **Framework Preset** as *Other*.

### Step 3 — Configure Build Settings

In the Vercel project settings (or during import):

| Setting | Value |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist/public` |
| Install Command | `npm install` |

### Step 4 — Add Environment Variables

In **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `NODE_ENV` | `production` |

> **Tip:** Use **Vercel Postgres** (Storage tab) for the easiest setup — it adds `DATABASE_URL` automatically.

### Step 5 — Run Database Migration

After your first deploy, run the migration once:

```bash
# From your local machine with DATABASE_URL set:
npm run db:push
```

Or paste `migrations/0000_init.sql` into your database's SQL editor.

### Step 6 — Deploy

Click **Deploy** in Vercel. Your tracker will be live at `https://shred-tracker-<hash>.vercel.app`.

For custom domains, go to **Settings → Domains** and add your own.

---

## Project Structure

```
shred-tracker/
├── api/
│   └── index.ts          # Vercel serverless function entry point
├── client/
│   └── src/
│       ├── App.tsx        # Router + layout
│       ├── pages/         # Dashboard, Weight, Nutrition, Workouts, Strength
│       └── components/    # Sidebar (hamburger on mobile), UI primitives
├── server/
│   ├── index.ts           # Express dev server
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # MemStorage (dev) + PgStorage (production)
│   ├── pg-storage.ts      # Drizzle ORM PostgreSQL implementation
│   └── db.ts              # Database connection via DATABASE_URL
├── shared/
│   └── schema.ts          # Drizzle schema (source of truth for types)
├── migrations/
│   └── 0000_init.sql      # Manual SQL migration
├── vercel.json            # Vercel build + rewrite config
├── .env.example           # Copy to .env for local dev
└── package.json
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (port 5000, hot reload) |
| `npm run build` | Build for production → `dist/public` |
| `npm start` | Start production server (`NODE_ENV=production`) |
| `npm run db:push` | Push schema to PostgreSQL (requires `DATABASE_URL`) |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/weight` | Weight log entries |
| DELETE | `/api/weight/:id` | Delete entry |
| GET/POST | `/api/workouts` | Workout log entries |
| DELETE | `/api/workouts/:id` | Delete entry |
| GET/POST/PATCH | `/api/nutrition` | Nutrition log entries |
| DELETE | `/api/nutrition/:id` | Delete entry |
| GET/POST | `/api/strength` | Strength/PR log entries |
| DELETE | `/api/strength/:id` | Delete entry |

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS v3, shadcn/ui, Recharts, Wouter (hash router)
- **Backend:** Express.js, Drizzle ORM
- **Database:** PostgreSQL (Neon / Supabase / Vercel Postgres) — falls back to in-memory
- **Deployment:** Vercel (serverless functions)

---

*Built with [Perplexity Computer](https://www.perplexity.ai/computer)*
