import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { QueryClient, keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Meal } from '../lib/hours'
export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000 } } })
export type ItemHistoryRow = { date: string; meal: Meal; station: string; hall: { slug: string; name: string } | null }
export function useHalls() {
  return useQuery({ queryKey: ['halls'], staleTime: Infinity, queryFn: async () => {
    const { data, error } = await supabase.from('halls').select('*').order('name')
    if (error) throw error
    return data
  } })
}
export function useHours(from: string, to: string) {
  return useQuery({ queryKey: ['hours', from, to], queryFn: async () => {
    const { data, error } = await supabase.from('hours').select('*').gte('date', from).lte('date', to)
    if (error) throw error
    return data
  } })
}
export function useHallMenu(hallId: number | undefined, date: string) {
  return useQuery({ queryKey: ['hallMenu', hallId, date], enabled: hallId !== undefined, queryFn: async () => {
    const { data, error } = await supabase.from('offerings').select('meal,station,portion,item:items(id,name,image_path,allergens,dietary,rating_avg,rating_count)').eq('hall_id', hallId!).eq('date', date)
    if (error) throw error
    return data
  } })
}
export function usePopular(date: string, hallId?: number) {
  return useQuery({ queryKey: ['popular', date, hallId], queryFn: async () => {
    const { data, error } = await supabase.rpc('popular_items', { p_date: date, ...(hallId !== undefined ? { p_hall: hallId } : {}), p_limit: 12 })
    if (error) throw error
    return data
  } })
}
export function useSearch(q: string, date: string) {
  return useQuery({ queryKey: ['search', q, date], enabled: q.trim().length >= 2, placeholderData: keepPreviousData, queryFn: async () => {
    const { data, error } = await supabase.rpc('search_items', { p_query: q, p_date: date, p_limit: 30 })
    if (error) throw error
    return data
  } })
}
export function useItem(id: string) {
  return useQuery({ queryKey: ['item', id], queryFn: async () => {
    const { data, error } = await supabase.from('items').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  } })
}
export function useItemHistory(id: string) {
  return useQuery({ queryKey: ['history', id], queryFn: async () => {
    const { data, error } = await supabase.from('offerings').select('date,meal,station,hall:halls(slug,name)').eq('item_id', id).order('date', { ascending: false }).limit(300)
    if (error) throw error
    return data
  } })
}
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    let active = true
    let changed = false
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { changed = true; if (active) setSession(next) })
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setError(error)
      else if (!changed) setSession(data.session)
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])
  return { session, error }
}
export function useMyRating(itemId: string, userId?: string) {
  return useQuery({ queryKey: ['myRating', itemId, userId], enabled: !!userId, queryFn: async () => {
    const { data, error } = await supabase.from('reviews').select('rating').eq('item_id', itemId).eq('user_id', userId!).maybeSingle()
    if (error) throw error
    return data?.rating ?? null
  } })
}
export function useRateItem(itemId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: async (rating: number | null) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!user) throw new Error('Sign in to rate')
    const { error } = rating === null
      ? await supabase.from('reviews').delete().eq('item_id', itemId).eq('user_id', user.id)
      : await supabase.from('reviews').upsert({ item_id: itemId, rating }, { onConflict: 'user_id,item_id' })
    if (error) throw error
  }, onSuccess: async () => {
    await Promise.all([['item', itemId], ['myRating', itemId], ['popular'], ['hallMenu'], ['search']].map(queryKey => client.invalidateQueries({ queryKey })))
  } })
}
