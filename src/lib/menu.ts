import type { Database } from './database.types'
export type CardItem = Pick<Database['public']['Tables']['items']['Row'], 'id' | 'name' | 'image_path' | 'allergens' | 'dietary' | 'rating_avg' | 'rating_count'>
export function groupByStation(offerings: { station: string; item: CardItem }[]): [string, CardItem[]][] {
  const groups = new Map<string, Map<string, CardItem>>()
  for (const row of offerings) {
    if (!groups.has(row.station)) groups.set(row.station, new Map())
    groups.get(row.station)!.set(row.item.id, row.item)
  }
  return [...groups].sort(([a], [b]) => a === b ? 0 : a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b))
    .map(([station, items]) => [station, [...items.values()].sort((a, b) => a.name.localeCompare(b.name))])
}
export function rankTopRated<T extends CardItem & { rating_sum: number }>(items: T[], limit = 12): T[] {
  const unique = new Map<string, T>()
  for (const item of items) if (!unique.has(item.id) && item.rating_count > 0) unique.set(item.id, item)
  return [...unique.values()].sort((a, b) =>
    (b.rating_sum + 10.5) / (b.rating_count + 3) - (a.rating_sum + 10.5) / (a.rating_count + 3) ||
    b.rating_count - a.rating_count ||
    a.name.localeCompare(b.name),
  ).slice(0, limit)
}
export function filterItems<T extends Pick<CardItem, 'dietary' | 'allergens'>>(items: T[], filters: { diet: string[]; avoid: string[] }): T[] {
  return items.filter(item => filters.diet.every(tag => item.dietary.includes(tag)) && !filters.avoid.some(tag => item.allergens.includes(tag)))
}
export function pickFavorites<T extends Pick<CardItem, 'id' | 'name'>>(items: T[], ids: Set<string>): T[] {
  const seen = new Set<string>()
  return items.filter(item => {
    if (!ids.has(item.id) || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  }).sort((a, b) => a.name.localeCompare(b.name))
}
