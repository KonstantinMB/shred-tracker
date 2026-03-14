/**
 * Minimal health check — bypasses the main bundle to diagnose FUNCTION_INVOCATION_FAILED.
 * If this works but /api/profile fails, the issue is in the main API bundle.
 */
export default function handler(req, res) {
  res.status(200).json({ ok: true, msg: "health check ok" });
}
