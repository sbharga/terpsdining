import type { GoTrueClient } from '@supabase/auth-js'
import { PostgrestClient } from '@supabase/postgrest-js'
import type { Database } from './database.types'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
const base = new URL(url)
export const authStorageKey = `sb-${base.hostname.split('.')[0]}-auth-token`
let authClient: Promise<GoTrueClient> | undefined
export function loadAuth(): Promise<GoTrueClient> {
  authClient ??= import('@supabase/auth-js')
    .then(({ AuthClient }) => new AuthClient({
      url: new URL('auth/v1', base).href,
      headers: { Authorization: `Bearer ${key}`, apikey: key },
      storageKey: authStorageKey,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    }))
    .catch(error => { authClient = undefined; throw error })
  return authClient
}
// auth-js has something to restore: a stored session, or an implicit-flow OAuth redirect (auth-js checks access_token/error/error_description/error_code in hash or query)
export function hasAuthState(): boolean {
  if (authClient) return true
  if (typeof window === 'undefined') return false
  try { if (window.localStorage.getItem(authStorageKey) !== null) return true } catch { /* storage blocked: auth-js would use memory storage */ }
  return /[#?&](?:access_token|error|error_description|error_code)=/.test(window.location.hash + window.location.search)
}
export const db = new PostgrestClient<Database>(new URL('rest/v1', base).href, {
  headers: { apikey: key },
  fetch: async (input, init) => {
    const headers = new Headers(init?.headers)
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${hasAuthState() ? (await (await loadAuth()).getSession()).data.session?.access_token ?? key : key}`)
    return fetch(input, { ...init, headers })
  },
})
const storageBase = new URL('storage/v1/object/public/food-images/', base).href
export function imageUrl(path: string | null, size: 'thumb' | 'full' = 'full'): string | null {
  return path ? `${storageBase}${size === 'thumb' ? 'thumbs/' : ''}${encodeURIComponent(path)}` : null
}
