import { addDays, diffDays, formatMonthDay, formatWeekday, relativeDay } from './dates'
import { meals, type Meal } from './hours'

export type HistoryRow = { date: string; meal: Meal; hall: { slug: string; name: string } | null }
export type HallMeals = { slug: string; name: string; meals: Meal[] }
export type HistoryDay = { date: string; halls: HallMeals[] }
export type HistoryRun = { from: string; to: string; days: number; halls: HallMeals[] }

export function groupHalls(rows: HistoryRow[]): HallMeals[] {
  const halls = new Map<string, { name: string; meals: Set<Meal> }>()
  for (const row of rows) {
    if (!row.hall) continue
    const hall = halls.get(row.hall.slug) ?? { name: row.hall.name, meals: new Set<Meal>() }
    hall.meals.add(row.meal)
    halls.set(row.hall.slug, hall)
  }
  return Array.from(halls, ([slug, hall]) => ({ slug, name: hall.name, meals: meals.filter(meal => hall.meals.has(meal)) })).sort((a, b) => a.name.localeCompare(b.name))
}

export function historyDays(rows: HistoryRow[]): HistoryDay[] {
  const byDate = new Map<string, HistoryRow[]>()
  for (const row of rows) {
    const bucket = byDate.get(row.date) ?? []
    bucket.push(row)
    byDate.set(row.date, bucket)
  }
  return Array.from(byDate, ([date, bucket]) => ({ date, halls: groupHalls(bucket) })).sort((a, b) => b.date.localeCompare(a.date))
}

export function historyRuns(days: HistoryDay[]): HistoryRun[] {
  const runs: HistoryRun[] = []
  let last = ''
  for (const day of days) {
    const run = runs[runs.length - 1]
    const sig = day.halls.map(hall => `${hall.slug}:${hall.meals.join(',')}`).join('|')
    if (run && day.date === addDays(run.from, -1) && sig === last) {
      run.from = day.date
      run.days += 1
    } else {
      runs.push({ from: day.date, to: day.date, days: 1, halls: day.halls })
      last = sig
    }
  }
  return runs
}

export function runLabel(run: HistoryRun): string {
  if (run.from === run.to) return formatMonthDay(run.to)
  if (run.from.slice(0, 7) === run.to.slice(0, 7)) return `${formatMonthDay(run.from)}–${Number(run.to.slice(8))}`
  return `${formatMonthDay(run.from)} – ${formatMonthDay(run.to)}`
}

export function runDetail(run: HistoryRun, today: string): string {
  if (run.from === run.to) return Math.abs(diffDays(today, run.to)) <= 1 ? relativeDay(run.to, today) : formatWeekday(run.to)
  return `${formatWeekday(run.from)}–${formatWeekday(run.to)} · ${run.days} days`
}

export function topHall(days: HistoryDay[]): { slug: string; name: string; days: number } | null {
  const counts = new Map<string, { slug: string; name: string; days: number }>()
  for (const day of days) {
    for (const hall of day.halls) {
      const entry = counts.get(hall.slug) ?? { slug: hall.slug, name: hall.name, days: 0 }
      entry.days += 1
      counts.set(hall.slug, entry)
    }
  }
  let best: { slug: string; name: string; days: number } | null = null
  for (const entry of counts.values()) {
    if (!best || entry.days > best.days || (entry.days === best.days && entry.name.localeCompare(best.name) < 0)) best = entry
  }
  return best
}

export function calendarDates(today: string, weeks: number): string[] {
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay()
  const end = addDays(today, 6 - dow)
  const total = weeks * 7
  const start = addDays(end, -(total - 1))
  return Array.from({ length: total }, (_, i) => addDays(start, i))
}
