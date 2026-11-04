export type Health = { ok: boolean; body: { status: 'ok' | 'down'; checks: { database: 'ok' | 'fail' }; latencyMs: number } }
// Reads one row through PostgREST with the publishable key: proves Supabase's API gateway, auth, and Postgres all answer.
export async function checkHealth(supabaseUrl: string | undefined, key: string | undefined, timeoutMs = 5000): Promise<Health> {
  const start = performance.now()
  let ok = false
  if (supabaseUrl && key) {
    try {
      const res = await fetch(new URL('rest/v1/halls?select=id&limit=1', supabaseUrl), { headers: { apikey: key }, signal: AbortSignal.timeout(timeoutMs) })
      const rows: unknown = res.ok ? await res.json() : null
      ok = Array.isArray(rows) && rows.length > 0
    } catch { /* network error, timeout, or bad JSON: reported as down */ }
  }
  return { ok, body: { status: ok ? 'ok' : 'down', checks: { database: ok ? 'ok' : 'fail' }, latencyMs: Math.round(performance.now() - start) } }
}
