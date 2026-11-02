import { useSyncExternalStore } from 'react'
const zone = 'America/New_York'
const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' })
const timeParts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })
const weekdayFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' })
const monthDayFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
export function todayET(now = new Date()): string {
  const parts = dateParts.formatToParts(now)
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-')
}
export function parseDateParam(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) ? value : fallback
}
export function nowMinutesET(now = new Date()): number {
  const parts = timeParts.formatToParts(now)
  return Number(parts.find(p => p.type === 'hour')!.value) * 60 + Number(parts.find(p => p.type === 'minute')!.value)
}
const subscribeNever = () => () => {}
// undefined in prerender and during hydration, so server HTML and the first client render match
export function useNowMinutesET(): number | undefined {
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false)
  return hydrated ? nowMinutesET() : undefined
}
export function addDays(iso: string, n: number): string {
  const date = new Date(`${iso}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + n)
  return date.toISOString().slice(0, 10)
}
export function formatDay(iso: string): string {
  return dayFormat.format(new Date(`${iso}T12:00:00Z`))
}
export function formatWeekday(iso: string): string {
  return weekdayFormat.format(new Date(`${iso}T12:00:00Z`))
}
export function formatMonthDay(iso: string): string {
  return monthDayFormat.format(new Date(`${iso}T12:00:00Z`))
}
export function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)
}
export function relativeDay(iso: string, today: string): string {
  if (iso === today) return 'Today'
  if (iso === addDays(today, -1)) return 'Yesterday'
  if (iso === addDays(today, 1)) return 'Tomorrow'
  return formatDay(iso)
}
