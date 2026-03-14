/**
 * Database connection — uses PostgreSQL via DATABASE_URL when set,
 * otherwise falls back gracefully (in-memory storage handles it).
 *
 * For Vercel: set DATABASE_URL in your project environment variables.
 * Supports: Neon, Supabase, Vercel Postgres, or any PostgreSQL connection string.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) return null;
  if (!db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    db = drizzle(pool, { schema });
  }
  return db;
}
