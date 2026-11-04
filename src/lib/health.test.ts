import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkHealth } from './health'

afterEach(() => vi.unstubAllGlobals())

describe('checkHealth', () => {
  it('is ok when the database returns a row', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([{ id: 1 }])))
    const { ok, body } = await checkHealth('https://x.supabase.co', 'key')
    expect(ok).toBe(true)
    expect(body).toMatchObject({ status: 'ok', checks: { database: 'ok' } })
  })
  it.each([
    ['an error status', () => Promise.resolve(new Response('nope', { status: 500 }))],
    ['an empty table', () => Promise.resolve(Response.json([]))],
    ['invalid JSON', () => Promise.resolve(new Response('<html>', { status: 200 }))],
    ['a network error', () => Promise.reject(new TypeError('fetch failed'))],
  ])('is down on %s', async (_name, impl) => {
    vi.stubGlobal('fetch', vi.fn(impl))
    const { ok, body } = await checkHealth('https://x.supabase.co', 'key')
    expect(ok).toBe(false)
    expect(body).toMatchObject({ status: 'down', checks: { database: 'fail' } })
  })
  it('is down without configuration, without calling the network', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([{ id: 1 }])))
    expect((await checkHealth(undefined, 'key')).ok).toBe(false)
    expect((await checkHealth('https://x.supabase.co', undefined)).ok).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })
})
