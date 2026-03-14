/**
 * Vercel Serverless Function entry point.
 * This wraps the Express app for deployment on Vercel.
 *
 * All /api/* requests are routed here by vercel.json.
 */
import express, { type Request, Response, NextFunction } from "express";
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

// Vercel handler
export default async function handler(req: Request, res: Response) {
  await ensureRoutes();
  app(req, res);
}
