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
export function filterItems<T extends Pick<CardItem, 'dietary' | 'allergens'>>(items: T[], filters: { diet: string[]; avoid: string[] }): T[] {
  return items.filter(item => filters.diet.every(tag => item.dietary.includes(tag)) && !filters.avoid.some(tag => item.allergens.includes(tag)))
}
