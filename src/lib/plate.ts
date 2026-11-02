import { useSyncExternalStore } from 'react'

export type PlateEntry = { id: string; name: string; servings: number }
export const MAX_SERVINGS = 20
const STORAGE_KEY = 'terpsdining:plate'

export function parsePlate(raw: string | null): PlateEntry[] {
  if (raw === null) return []
  let value: unknown
  try { value = JSON.parse(raw) } catch { return [] }
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const entries: PlateEntry[] = []
  for (const entry of value) {
    if (entry === null || typeof entry !== 'object') continue
    const { id, name, servings } = entry as Record<string, unknown>
    if (typeof id !== 'string' || id === '' || typeof name !== 'string') continue
    if (typeof servings !== 'number' || !Number.isInteger(servings) || servings < 1 || servings > MAX_SERVINGS) continue
    if (seen.has(id)) continue
    seen.add(id)
    entries.push({ id, name, servings })
  }
  return entries
}

export function setServings(plate: PlateEntry[], item: { id: string; name: string }, servings: number): PlateEntry[] {
  if (servings <= 0) return plate.filter(entry => entry.id !== item.id)
  const next = Math.min(servings, MAX_SERVINGS)
  const index = plate.findIndex(entry => entry.id === item.id)
  if (index === -1) return [...plate, { id: item.id, name: item.name, servings: next }]
  return plate.map((entry, i) => i === index ? { ...entry, servings: next } : entry)
}

const empty: PlateEntry[] = []
let plate: PlateEntry[] | null = null
const listeners = new Set<() => void>()

function readStorage() {
  try { return window.localStorage.getItem(STORAGE_KEY) } catch { return null }
}
export function readPlate() { return plate ??= parsePlate(readStorage()) }
function getServerSnapshot() { return empty }
function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  plate = parsePlate(readStorage())
  listeners.forEach(l => l())
}
function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

export function updatePlate(next: PlateEntry[]) {
  plate = next
  try {
    if (next.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch { /* storage unavailable: plate stays in memory for this page session */ }
  listeners.forEach(listener => listener())
}

export function usePlate(): PlateEntry[] {
  return useSyncExternalStore(subscribe, readPlate, getServerSnapshot)
}

export function usePlateServings(id: string): number {
  return useSyncExternalStore(subscribe, () => readPlate().find(entry => entry.id === id)?.servings ?? 0, () => 0)
}
