import { checkHealth } from '../src/lib/health.ts'

export async function GET(): Promise<Response> {
  const { ok, body } = await checkHealth(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  return Response.json(body, { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
