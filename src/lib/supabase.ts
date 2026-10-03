import { AuthClient } from '@supabase/auth-js'
import { PostgrestClient } from '@supabase/postgrest-js'
import type { Database } from './database.types'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
const base = new URL(url)
export const auth = new AuthClient({
  url: new URL('auth/v1', base).href,
  headers: { Authorization: `Bearer ${key}`, apikey: key },
  storageKey: `sb-${base.hostname.split('.')[0]}-auth-token`,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'implicit',
})
export const db = new PostgrestClient<Database>(new URL('rest/v1', base).href, {
  headers: { apikey: key },
  fetch: async (input, init) => {
    const headers = new Headers(init?.headers)
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${(await auth.getSession()).data.session?.access_token ?? key}`)
    return fetch(input, { ...init, headers })
  },
})
const storageBase = new URL('storage/v1/object/public/food-images/', base).href
export function imageUrl(path: string | null, size: 'thumb' | 'full' = 'full'): string | null {
  return path ? `${storageBase}${size === 'thumb' ? 'thumbs/' : ''}${encodeURIComponent(path)}` : null
}
