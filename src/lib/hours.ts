import type { Database } from './database.types'
export type Hours = Database['public']['Tables']['hours']['Row']
export type Meal = Database['public']['Enums']['meal']
export const meals: Meal[] = ['Breakfast', 'Lunch', 'Dinner']
export type MealStatus = 'open' | 'upcoming' | 'past' | 'closed' | 'tbd'
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`
}
export function mealStatus(row: Hours, nowMin: number): MealStatus {
  if (row.status !== 'open' || !row.opens || !row.closes) return row.status === 'closed' ? 'closed' : 'tbd'
  const [oh, om] = row.opens.split(':').map(Number)
  const [ch, cm] = row.closes.split(':').map(Number)
  if (nowMin < oh * 60 + om) return 'upcoming'
  return nowMin < ch * 60 + cm ? 'open' : 'past'
}
export function hallStatus(rows: Hours[], nowMin: number): { label: string } {
  const ordered = [...rows].sort((a, b) => meals.indexOf(a.meal) - meals.indexOf(b.meal))
  const open = ordered.find(row => mealStatus(row, nowMin) === 'open')
  if (open) return { label: `Open · ${open.meal} until ${formatTime(open.closes!)}` }
  const next = ordered.find(row => mealStatus(row, nowMin) === 'upcoming')
  if (next) return { label: `Opens ${formatTime(next.opens!)} · ${next.meal}` }
  if (!rows.length || rows.some(row => row.status === 'tbd')) return { label: 'Hours TBD' }
  return { label: rows.some(row => row.status === 'open') ? 'Closed for today' : 'Closed today' }
}
export function defaultMeal(rows: Hours[], nowMin: number, isToday: boolean): Meal {
  if (!isToday) return meals.find(meal => rows.some(row => row.meal === meal && row.status === 'open')) ?? 'Breakfast'
  return rows.find(row => mealStatus(row, nowMin) === 'open')?.meal
    ?? [...rows].sort((a, b) => meals.indexOf(a.meal) - meals.indexOf(b.meal)).find(row => mealStatus(row, nowMin) === 'upcoming')?.meal
    ?? 'Dinner'
}
