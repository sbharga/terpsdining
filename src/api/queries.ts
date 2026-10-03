import { useMemo, useSyncExternalStore } from 'react'
import type { Session } from '@supabase/auth-js'
import { QueryClient, keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auth, db } from '../lib/supabase'
import type { Meal } from '../lib/hours'
export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000 } } })
export type ItemHistoryRow = { date: string; meal: Meal; station: string; hall: { slug: string; name: string } | null }
export const SEARCH_PAGE_SIZE = 30

export const hoursQuery = (from: string, to: string) => queryOptions({
  queryKey: ['hours', from, to] as const,
  staleTime: 6 * 60 * 60_000,
  queryFn: async () => {
    const { data, error } = await db.from('hours').select('*').gte('date', from).lte('date', to)
    if (error) throw error
    return data
  },
})
export const hallMenuQuery = (hallId: number, date: string) => queryOptions({
  queryKey: ['hallMenu', hallId, date] as const,
  staleTime: 30 * 60_000,
  queryFn: async () => {
    const { data, error } = await db.from('offerings').select('meal,station,portion,item:items(id,name,image_path,allergens,dietary,rating_avg,rating_count,rating_sum)').eq('hall_id', hallId).eq('date', date)
    if (error) throw error
    return data
  },
})
export const popularQuery = (date: string) => queryOptions({
  queryKey: ['popular', date] as const,
  queryFn: async () => {
    const { data, error } = await db.rpc('popular_items', { p_date: date, p_limit: 12 })
    if (error) throw error
    return data
  },
})
export const itemQuery = (id: string) => queryOptions({
  queryKey: ['item', id] as const,
  queryFn: async () => {
    const { data, error } = await db.from('items').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  },
})
export const historyQuery = (id: string) => queryOptions({
  queryKey: ['history', id] as const,
  staleTime: 6 * 60 * 60_000,
  queryFn: async (): Promise<ItemHistoryRow[]> => {
    const { data, error } = await db.from('offerings').select('date,meal,station,hall:halls(slug,name)').eq('item_id', id).order('date', { ascending: false }).limit(300)
    if (error) throw error
    return data
  },
})
export function useHours(from: string, to: string) { return useQuery(hoursQuery(from, to)) }
export function useHallMenu(hallId: number, date: string) { return useQuery(hallMenuQuery(hallId, date)) }
export function usePopular(date: string) { return useQuery(popularQuery(date)) }
export function useSearch(q: string, page: number, date: string) {
  return useQuery({ queryKey: ['search', q, page, date], enabled: q.trim().length >= 2, placeholderData: keepPreviousData, queryFn: async () => {
    const { data, error } = await db.rpc('search_items', { p_query: q, p_date: date, p_limit: SEARCH_PAGE_SIZE, p_offset: (page - 1) * SEARCH_PAGE_SIZE })
    if (error) throw error
    return data
  } })
}
export function useItem(id: string) { return useQuery(itemQuery(id)) }
export function useItemHistory(id: string) { return useQuery(historyQuery(id)) }

type SessionState = { session: Session | null; error: Error | null; loading: boolean }
const serverSessionState: SessionState = { session: null, error: null, loading: true }
let sessionState = serverSessionState
let sessionStarted = false
const sessionListeners = new Set<() => void>()
function setSessionState(next: SessionState) {
  sessionState = next
  sessionListeners.forEach(listener => listener())
}
function subscribeSession(listener: () => void) {
  sessionListeners.add(listener)
  if (!sessionStarted) {
    sessionStarted = true
    auth.onAuthStateChange((_event, session) => setSessionState({ session, error: null, loading: false }))
    auth.getSession().then(({ data, error }) => {
      if (error) setSessionState({ session: null, error, loading: false })
      else if (sessionState.loading) setSessionState({ session: data.session, error: null, loading: false })
    }).catch(error => setSessionState({ session: null, error, loading: false }))
  }
  return () => { sessionListeners.delete(listener) }
}
function getSessionSnapshot() { return sessionState }
function getServerSessionSnapshot() { return serverSessionState }
export function useSession() { return useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot) }
export function useMyRating(itemId: string, userId?: string) {
  return useQuery({ queryKey: ['myRating', itemId, userId], enabled: !!userId, queryFn: async () => {
    const { data, error } = await db.from('reviews').select('rating').eq('item_id', itemId).eq('user_id', userId!).maybeSingle()
    if (error) throw error
    return data?.rating ?? null
  } })
}
export function useRateItem(itemId: string, userId?: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: async (rating: number | null) => {
    if (!userId) throw new Error('Sign in to rate')
    const { error } = rating === null
      ? await db.from('reviews').delete().eq('item_id', itemId).eq('user_id', userId)
      : await db.from('reviews').upsert({ item_id: itemId, rating }, { onConflict: 'user_id,item_id' })
    if (error) throw error
  }, onSuccess: async (_, rating) => {
    client.setQueryData(['myRating', itemId, userId], rating)
    await Promise.all([['item', itemId], ['myRatings'], ['favorites'], ['favoriteItems'], ['popular'], ['hallMenu'], ['search']].map(queryKey => client.invalidateQueries({ queryKey })))
  } })
}
export function useFavorites(userId?: string) {
  return useQuery({ queryKey: ['favorites', userId], enabled: !!userId, queryFn: async () => {
    const { data, error } = await db.from('favorites').select('item_id,created_at,item:items(id,name,image_path,allergens,dietary,rating_avg,rating_count)').eq('user_id', userId!).order('created_at', { ascending: false })
    if (error) throw error
    return data
  } })
}
export function useFavoriteIds(userId?: string): Set<string> {
  const { data } = useFavorites(userId)
  return useMemo(() => new Set((data ?? []).map(row => row.item_id)), [data])
}
export function useFavoriteItems(date: string, userId?: string) {
  return useQuery({ queryKey: ['favoriteItems', date, userId], enabled: !!userId, queryFn: async () => {
    const { data, error } = await db.rpc('favorite_items', { p_date: date })
    if (error) throw error
    return data
  } })
}
export function useToggleFavorite(itemId: string, userId?: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: async (favorite: boolean) => {
    if (!userId) throw new Error('Sign in to favorite')
    const { error } = favorite
      ? await db.from('favorites').upsert({ item_id: itemId }, { onConflict: 'user_id,item_id', ignoreDuplicates: true })
      : await db.from('favorites').delete().eq('item_id', itemId).eq('user_id', userId)
    if (error) throw error
  }, onSuccess: async () => {
    await Promise.all([['favorites'], ['favoriteItems']].map(queryKey => client.invalidateQueries({ queryKey })))
  } })
}
export function useMyRatings(userId?: string) {
  return useQuery({ queryKey: ['myRatings', userId], enabled: !!userId, queryFn: async () => {
    const { data, error } = await db.from('reviews').select('rating,updated_at,item:items(id,name,image_path,allergens,dietary,rating_avg,rating_count)').eq('user_id', userId!).order('updated_at', { ascending: false })
    if (error) throw error
    return data
  } })
}
export function useDeleteAccount() {
  const client = useQueryClient()
  return useMutation({ mutationFn: async () => {
    const { error } = await db.rpc('delete_account')
    if (error) throw error
    await auth.signOut({ scope: 'local' })
  }, onSuccess: async () => { await client.invalidateQueries() } })
}
