import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../../api/health.ts' // lives in api/ because Vercel only deploys self-contained functions there; tests can't sit beside it

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'key')
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('GET /api/health', () => {
  it('is 200 when the database returns a row', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([{ id: 1 }])))
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'ok', checks: { database: 'ok' } })
  })
  it.each([
    ['an error status', () => Promise.resolve(new Response('nope', { status: 500 }))],
    ['an empty table', () => Promise.resolve(Response.json([]))],
    ['invalid JSON', () => Promise.resolve(new Response('<html>', { status: 200 }))],
    ['a network error', () => Promise.reject(new TypeError('fetch failed'))],
  ])('is 503 on %s', async (_name, impl) => {
    vi.stubGlobal('fetch', vi.fn(impl))
    const res = await GET()
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ status: 'down', checks: { database: 'fail' } })
  })
  it('is 503 without configuration, without calling the network', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([{ id: 1 }])))
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect((await GET()).status).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
  })
})
