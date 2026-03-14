/**
 * Database connection — uses PostgreSQL via DATABASE_URL when set,
 * otherwise falls back gracefully (in-memory storage handles it).
 *
 * For Vercel + Supabase: use port 6543 (transaction pooler) in your connection string.
 * Example: postgresql://postgres:PASS@db.xxx.supabase.co:6543/postgres?sslmode=require
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

let db: ReturnType<typeof drizzle> | null = null;

function getConnectionString(): string {
  const url = process.env.DATABASE_URL || "";
  // Supabase: use port 6543 (transaction pooler) for serverless — port 5432 can exhaust connections
  if (url.includes("supabase.co") && url.includes(":5432/")) {
    return url.replace(":5432/", ":6543/");
  }
  return url;
}

export function getDb() {
  const conn = getConnectionString();
  if (!conn) return null;
  if (!db) {
    const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
    db = drizzle(pool, { schema });
  }
  return db;
}
