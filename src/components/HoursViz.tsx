import { Link } from 'react-router'
import { formatDay } from '../lib/dates'
import type { Hall } from '../lib/halls'
import { hallStatus, hoursLabel, meals, mealStatus, type Hours } from '../lib/hours'
import { hallTone, mealTones, tones } from '../lib/theme'
import { MealIcon, StatusPill } from './UI'

type Range = { start: number; end: number }

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function openSpan(row: Hours): [number, number] | null {
  if (row.status !== 'open' || !row.opens || !row.closes) return null
  const start = toMinutes(row.opens)
  const end = toMinutes(row.closes)
  return [start, end <= start ? end + 1440 : end]
}

// The shared time axis: whole hours around every open meal in the given rows.
function axisRange(rows: Hours[]): Range {
  const edges = rows.flatMap(row => openSpan(row) ?? [])
  if (!edges.length) return { start: 7 * 60, end: 21 * 60 }
  const start = Math.floor(Math.min(...edges) / 60) * 60
  return { start, end: Math.max(Math.ceil(Math.max(...edges) / 60) * 60, start + 360) }
}

function ticks({ start, end }: Range): number[] {
  const step = [1, 2, 3, 4, 6].find(size => (end - start) / 60 / size <= 7) ?? 6
  const marks: number[] = []
  for (let hour = Math.ceil(start / 60); hour * 60 <= end; hour++) if (hour % step === 0) marks.push(hour * 60)
  return marks
}

const percent = (minutes: number, { start, end }: Range) => ((minutes - start) / (end - start)) * 100

function tickLabel(minutes: number): string {
  const hour = (minutes / 60) % 24
  return `${hour % 12 || 12}${hour < 12 ? 'a' : 'p'}`
}

function HourAxis({ range, className = '' }: { range: Range; className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-4 text-[10px] font-medium tabular-nums text-muted ${className}`}>
      {ticks(range).map(mark => {
        const x = percent(mark, range)
        return <span key={mark} className={`absolute top-0 ${x < 2 ? '' : x > 98 ? '-translate-x-full' : '-translate-x-1/2'}`} style={{ left: `${x}%` }}>{tickLabel(mark)}</span>
      })}
    </div>
  )
}

// One day as a bar on the shared axis: a segment per open meal, plus a "now" cursor on today.
function Track({ rows, range, now, blank = false, className = 'h-9' }: { rows: Hours[]; range: Range; now?: number; blank?: boolean; className?: string }) {
  const segments = meals.flatMap(meal => {
    const row = rows.find(entry => entry.meal === meal)
    const span = row && openSpan(row)
    return row && span ? [{ row, span }] : []
  })
  const cursor = now !== undefined && now >= range.start && now <= range.end ? percent(now, range) : null
  return (
    <div aria-hidden="true" className={`relative rounded-full bg-surface-2 ${className}`}>
      {ticks(range).map(mark => <span key={mark} className="absolute inset-y-1.5 w-px bg-ink/10" style={{ left: `${percent(mark, range)}%` }} />)}
      {!blank && segments.length === 0 && <span className="absolute inset-0 grid place-items-center text-xs font-semibold text-muted">{rows.length > 0 && rows.every(row => row.status === 'closed') ? 'Closed' : 'TBD'}</span>}
      {segments.map(({ row, span }) => {
        const left = percent(span[0], range)
        const width = percent(span[1], range) - left
        const past = now !== undefined && mealStatus(row, now) === 'past'
        return (
          <span key={row.meal} className={`absolute inset-y-0 flex items-center justify-center overflow-hidden rounded-full ring-2 ring-surface ${tones[mealTones[row.meal]].solid} ${past ? 'opacity-35' : ''}`} style={{ left: `${left}%`, width: `${width}%` }}>
            {width >= 9 && <MealIcon meal={row.meal} size={14} className="text-white" />}
          </span>
        )
      })}
      {cursor !== null && (
        <span className="absolute -inset-y-1.5 z-10 w-0.5 -translate-x-1/2 rounded-full bg-ink" style={{ left: `${cursor}%` }}>
          <span className="absolute -top-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-ink" />
        </span>
      )}
    </div>
  )
}

// "10am–10:30am" -> "10–10:30am": drop the first meridiem when both ends share it.
function shortRange(label: string): string {
  const [from, to] = label.split('–')
  return to && from.slice(-2) === to.slice(-2) ? `${from.slice(0, -2)}–${to}` : label
}

// Exact times for the three meals; the open meal is highlighted.
function MealTimes({ rows, now }: { rows: Hours[]; now?: number }) {
  return (
    <dl className="flex flex-wrap justify-between gap-1 text-xs sm:grid sm:grid-cols-3">
      {meals.map(meal => {
        const row = rows.find(entry => entry.meal === meal)
        const label = shortRange(hoursLabel(row))
        const live = row !== undefined && now !== undefined && mealStatus(row, now) === 'open'
        return (
          <div key={meal} className={`flex min-w-0 items-center gap-1.5 rounded-xl px-2 py-1 ${live ? 'bg-emerald-50 dark:bg-emerald-400/10' : ''}`}>
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted"><MealIcon meal={meal} size={14} /><span className="sr-only">{meal}</span></dt>
            <dd className={`whitespace-nowrap tabular-nums ${label === 'Closed' || label === 'TBD' ? 'text-muted' : 'font-medium text-ink'}`}>{label}</dd>
          </div>
        )
      })}
    </dl>
  )
}

// Today for every hall on one shared axis, so "who is open at 9pm?" is a glance.
export function HoursBoard({ halls, rows, now, heading: Heading = 'h2' }: { halls: Hall[]; rows?: Hours[]; now: number; heading?: 'h2' | 'h3' }) {
  const range = axisRange(rows ?? [])
  return (
    <div className="grid gap-3">
      {halls.map(hall => {
        const hallRows = rows?.filter(row => row.hall_id === hall.id)
        return (
          <article key={hall.id} className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            <div className={`relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3 text-white ${hallTone(hall.slug).solid}`}>
              <Heading className="font-display text-xl font-bold"><Link to={`/halls/${hall.slug}`} className="after:absolute after:inset-0 hover:underline">{hall.name}</Link></Heading>
              {hallRows && <StatusPill status={hallStatus(hallRows, now)} />}
            </div>
            <div className="space-y-1.5 px-5 pb-4 pt-4">
              <Track rows={hallRows ?? []} range={range} now={now} blank={!hallRows} />
              <HourAxis range={range} />
              {hallRows && <MealTimes rows={hallRows} now={now} />}
            </div>
          </article>
        )
      })}
    </div>
  )
}

const weekColumns = 'grid-cols-[minmax(0,1fr)] sm:grid-cols-[8.5rem_minmax(0,1fr)_19rem]'

// One hall's week: a bar per day on a shared axis, with exact times beside it.
export function WeekChart({ hall, dates, rows, today, now }: { hall: Hall; dates: string[]; rows: Hours[]; today: string; now: number }) {
  const range = axisRange(rows.filter(row => dates.includes(row.date)))
  const hallRows = rows.filter(row => row.hall_id === hall.id)
  return (
    <div>
      <div className={`grid gap-x-4 px-5 pt-3 ${weekColumns}`}>
        <span className="hidden sm:block" />
        <HourAxis range={range} />
        <dl className="hidden grid-cols-3 gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted sm:grid">
          {meals.map(meal => <dt key={meal} className="flex items-center gap-1.5 px-2"><MealIcon meal={meal} size={14} />{meal}</dt>)}
        </dl>
      </div>
      <ol>
        {dates.map(date => {
          const dayRows = hallRows.filter(row => row.date === date)
          const isToday = date === today
          return (
            <li key={date} className={`grid items-center gap-x-4 gap-y-1.5 border-t border-line px-5 py-2.5 ${weekColumns} ${isToday ? 'bg-orange-50/70 dark:bg-orange-400/10' : ''}`}>
              <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium">
                <time dateTime={date}>{formatDay(date)}</time>
                {isToday && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-brand-ink">Today</span>}
              </div>
              <div className="min-w-0"><Track rows={dayRows} range={range} now={isToday ? now : undefined} className="h-7" /></div>
              <MealTimes rows={dayRows} />
            </li>
          )
        })}
      </ol>
    </div>
  )
}
