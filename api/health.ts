// Self-contained on purpose: Vercel does not bundle imports from ../src into functions (ERR_MODULE_NOT_FOUND at runtime).
// Reads one row through PostgREST with the publishable key: proves Supabase's API gateway, auth, and Postgres all answer.
export async function GET(): Promise<Response> {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const start = performance.now()
  let ok = false
  if (url && key) {
    try {
      const res = await fetch(new URL('rest/v1/halls?select=id&limit=1', url), { headers: { apikey: key }, signal: AbortSignal.timeout(5000) })
      const rows: unknown = res.ok ? await res.json() : null
      ok = Array.isArray(rows) && rows.length > 0
    } catch { /* network error, timeout, or bad JSON: reported as down */ }
  }
  const body = { status: ok ? 'ok' : 'down', checks: { database: ok ? 'ok' : 'fail' }, latencyMs: Math.round(performance.now() - start) }
  return Response.json(body, { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
