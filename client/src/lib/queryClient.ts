import { QueryClient, QueryFunction } from "@tanstack/react-query";
import * as api from "./supabaseApi";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// apiRequest — uses Supabase when configured, else fetch (local Express)
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  if (api.hasSupabase()) {
    const payload = (data ?? {}) as Record<string, unknown>;
    try {
      let result: unknown;
      if (method === "POST" && url === "/api/profile") {
        result = await api.upsertProfile(payload);
      } else if (method === "PATCH" && url === "/api/profile") {
        result = await api.upsertProfile(payload);
      } else if (method === "POST" && url === "/api/weight") {
        result = await api.addWeightLog(payload);
      } else if (method === "DELETE" && url.startsWith("/api/weight/")) {
        await api.deleteWeightLog(Number(url.split("/").pop()));
        return { ok: true } as Response;
      } else if (method === "POST" && url === "/api/nutrition") {
        result = await api.addNutritionLog(payload);
      } else if (method === "PATCH" && url.match(/^\/api\/nutrition\/\d+$/)) {
        const id = Number(url.split("/").pop());
        result = await api.updateNutritionLog(id, payload);
      } else if (method === "DELETE" && url.startsWith("/api/nutrition/")) {
        await api.deleteNutritionLog(Number(url.split("/").pop()));
        return { ok: true } as Response;
      } else if (method === "POST" && url === "/api/workouts") {
        result = await api.addWorkoutLog(payload);
      } else if (method === "PATCH" && url.match(/^\/api\/workouts\/\d+$/)) {
        const id = Number(url.split("/").pop());
        result = await api.updateWorkoutLog(id, payload);
      } else if (method === "DELETE" && url.startsWith("/api/workouts/")) {
        await api.deleteWorkoutLog(Number(url.split("/").pop()));
        return { ok: true } as Response;
      } else if (method === "POST" && url === "/api/exercises") {
        result = await api.addExercise(payload);
      } else if (method === "DELETE" && url.startsWith("/api/exercises/")) {
        await api.deleteExercise(Number(url.split("/").pop()));
        return { ok: true } as Response;
      } else if (method === "POST" && url === "/api/exercise-logs") {
        result = await api.addExerciseLog(payload);
      } else if (method === "PATCH" && url.match(/^\/api\/exercise-logs\/\d+$/)) {
        const id = Number(url.split("/").pop());
        result = await api.updateExerciseLog(id, payload);
      } else if (method === "DELETE" && url.startsWith("/api/exercise-logs/")) {
        await api.deleteExerciseLog(Number(url.split("/").pop()));
        return { ok: true } as Response;
      } else if (method === "POST" && url === "/api/strength") {
        result = await api.addStrengthLog(payload);
      } else if (method === "DELETE" && url.startsWith("/api/strength/")) {
        await api.deleteStrengthLog(Number(url.split("/").pop()));
        return { ok: true } as Response;
      } else {
        const res = await fetch(`${API_BASE}${url}`, {
          method,
          headers: data ? { "Content-Type": "application/json" } : {},
          body: data ? JSON.stringify(data) : undefined,
        });
        await throwIfResNotOk(res);
        return res;
      }
      return { ok: true, json: () => Promise.resolve(result) } as Response;
    } catch (e) {
      throw e;
    }
  }
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
  return res;
}

// Supabase-backed query function — replaces fetch for all data
const supabaseQueryFn: QueryFunction<unknown> = async ({ queryKey }) => {
  const path = (queryKey[0] as string) || "";
  if (!api.hasSupabase()) {
    // Fallback to fetch when Supabase not configured
    const res = await fetch(`${API_BASE}${path}`);
    if (res.status === 401) return null;
    await throwIfResNotOk(res);
    return res.json();
  }
  switch (path) {
    case "/api/profile":
      return api.getProfile();
    case "/api/weight":
      return api.getWeightLogs();
    case "/api/nutrition":
      return api.getNutritionLogs();
    case "/api/workouts":
      return api.getWorkoutLogs();
    case "/api/exercises":
      return api.getExercises();
    case "/api/exercise-logs":
      return api.getExerciseLogs();
    case "/api/strength":
      return api.getStrengthLogs();
    default:
      const res = await fetch(`${API_BASE}${path}`);
      await throwIfResNotOk(res);
      return res.json();
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: supabaseQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
