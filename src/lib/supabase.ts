import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
export const supabase = createClient<Database>(url, key)
export function imageUrl(path: string | null): string | null {
  return path ? supabase.storage.from('food-images').getPublicUrl(path).data.publicUrl : null
}
