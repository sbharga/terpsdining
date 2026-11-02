import type { Database } from './database.types'
export type Hours = Database['public']['Tables']['hours']['Row']
export type Meal = Database['public']['Enums']['meal']
export const meals: Meal[] = ['Breakfast', 'Lunch', 'Dinner']
export type MealStatus = 'open' | 'upcoming' | 'past' | 'closed' | 'tbd'
export type HallState = 'open' | 'upcoming' | 'closed' | 'tbd'
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`
}
export function hoursLabel(row: Hours | undefined): string {
  return row?.status === 'open' && row.opens && row.closes
    ? `${formatTime(row.opens)}–${formatTime(row.closes)}`
    : row?.status === 'closed' ? 'Closed' : 'TBD'
}
export function mealStatus(row: Hours, nowMin: number): MealStatus {
  if (row.status !== 'open' || !row.opens || !row.closes) return row.status === 'closed' ? 'closed' : 'tbd'
  const [oh, om] = row.opens.split(':').map(Number)
  const [ch, cm] = row.closes.split(':').map(Number)
  if (nowMin < oh * 60 + om) return 'upcoming'
  return nowMin < ch * 60 + cm ? 'open' : 'past'
}
export function hallStatus(rows: Hours[], nowMin: number): { label: string; state: HallState } {
  const ordered = [...rows].sort((a, b) => meals.indexOf(a.meal) - meals.indexOf(b.meal))
  const open = ordered.find(row => mealStatus(row, nowMin) === 'open')
  if (open) return { label: `Open · ${open.meal} until ${formatTime(open.closes!)}`, state: 'open' }
  const next = ordered.find(row => mealStatus(row, nowMin) === 'upcoming')
  if (next) return { label: `Opens ${formatTime(next.opens!)} · ${next.meal}`, state: 'upcoming' }
  if (!rows.length || rows.some(row => row.status === 'tbd')) return { label: 'Hours TBD', state: 'tbd' }
  return { label: rows.some(row => row.status === 'open') ? 'Closed for today' : 'Closed today', state: 'closed' }
}
export function defaultMeal(rows: Hours[], nowMin: number, isToday: boolean): Meal {
  if (!isToday) return meals.find(meal => rows.some(row => row.meal === meal && row.status === 'open')) ?? 'Breakfast'
  return rows.find(row => mealStatus(row, nowMin) === 'open')?.meal
    ?? [...rows].sort((a, b) => meals.indexOf(a.meal) - meals.indexOf(b.meal)).find(row => mealStatus(row, nowMin) === 'upcoming')?.meal
    ?? 'Dinner'
}
// Consecutive days with identical meal hours share one group; today always stands alone.
export function groupDays(dates: string[], rows: Hours[], today: string): { dates: string[]; rows: Hours[] }[] {
  const key = (date: string) => meals.map(meal => {
    const row = rows.find(entry => entry.date === date && entry.meal === meal)
    return row ? `${row.status}|${row.opens}|${row.closes}` : '-'
  }).join(',')
  const groups: { dates: string[]; rows: Hours[]; key: string }[] = []
  for (const date of dates) {
    const dateKey = key(date)
    const last = groups[groups.length - 1]
    if (last && date !== today && last.dates[0] !== today && last.key === dateKey) last.dates.push(date)
    else groups.push({ dates: [date], rows: rows.filter(row => row.date === date), key: dateKey })
  }
  return groups.map(({ dates, rows }) => ({ dates, rows }))
}
