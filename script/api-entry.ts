/**
 * Vercel Serverless Function entry point.
 * Bundled to api/index.js by the build script.
 *
 * All /api/* requests are routed here by vercel.json.
 */
import express, { type Request, Response } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS for local dev
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const httpServer = createServer(app);

let routesRegistered = false;
async function ensureRoutes() {
  if (!routesRegistered) {
    await registerRoutes(httpServer, app);
    routesRegistered = true;
  }
}

// Vercel handler — rewrite sends path as ?path=:path*, restore req.url for Express
export default async function handler(req: Request, res: Response) {
  await ensureRoutes();
  const url = new URL(req.url || "/", "http://localhost");
  const pathParam = url.searchParams.get("path");
  if (pathParam) {
    const qs = [...url.searchParams.entries()]
      .filter(([k]) => k !== "path")
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    (req as Request & { url: string }).url = `/api/${pathParam}${qs ? `?${qs}` : ""}`;
  }
  app(req, res);
}
