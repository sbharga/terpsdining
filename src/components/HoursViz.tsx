import { Link } from 'react-router'
import { formatWeekday } from '../lib/dates'
import type { Hall } from '../lib/halls'
import { groupDays, hallStatus, hoursLabel, meals, mealStatus, type Hours } from '../lib/hours'
import { hallTone } from '../lib/theme'
import { MealIcon, StatusPill } from './UI'

// "10am–10:30am" -> "10–10:30am": drop the first meridiem when both ends share it.
function shortRange(label: string): string {
  const [from, to] = label.split('–')
  return to && from.slice(-2) === to.slice(-2) ? `${from.slice(0, -2)}–${to}` : label
}

// Exact times for the three meals; the open meal is highlighted.
function MealTimes({ rows, now }: { rows: Hours[]; now?: number }) {
  return (
    <dl className="flex flex-wrap justify-between gap-1 text-sm sm:grid sm:grid-cols-3">
      {meals.map(meal => {
        const row = rows.find(entry => entry.meal === meal)
        const label = shortRange(hoursLabel(row))
        const live = row !== undefined && now !== undefined && mealStatus(row, now) === 'open'
        return (
          <div key={meal} className={`flex min-w-0 items-center gap-1 rounded-xl px-1.5 py-1 ${live ? 'bg-emerald-50 dark:bg-emerald-400/10' : ''}`}>
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted"><MealIcon meal={meal} size={14} /><span className="sr-only">{meal}</span></dt>
            <dd className={`whitespace-nowrap tabular-nums ${label === 'Closed' || label === 'TBD' ? 'text-muted' : 'font-medium text-ink'}`}>{label}</dd>
          </div>
        )
      })}
    </dl>
  )
}

// The three meals as full-width rows: the open meal is highlighted, past meals are muted.
function MealList({ rows, now }: { rows: Hours[]; now?: number }) {
  return (
    <dl className="divide-y divide-line">
      {meals.map(meal => {
        const row = rows.find(entry => entry.meal === meal)
        const label = hoursLabel(row)
        const status = row && now !== undefined ? mealStatus(row, now) : undefined
        return (
          <div key={meal} className={`flex items-center justify-between gap-3 px-5 py-3 ${status === 'open' ? 'bg-emerald-50 dark:bg-emerald-400/10' : ''}`}>
            <dt className={`flex items-center gap-2.5 font-medium ${status === 'past' ? 'text-muted' : ''}`}><MealIcon meal={meal} size={18} />{meal}{status === 'open' && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Now</span>}</dt>
            <dd className={`whitespace-nowrap tabular-nums ${label === 'Closed' || label === 'TBD' || status === 'past' ? 'text-muted' : 'font-semibold text-ink'}`}>{label}</dd>
          </div>
        )
      })}
    </dl>
  )
}

// Status band for every hall, with meal times as one compact row (Home) or a full list (Hours).
export function HoursBoard({ halls, rows, now, heading: Heading = 'h2', list = false }: { halls: Hall[]; rows?: Hours[]; now?: number; heading?: 'h2' | 'h3'; list?: boolean }) {
  return (
    <div className={`grid gap-4 ${list ? 'lg:grid-cols-3' : ''}`}>
      {halls.map(hall => {
        const hallRows = rows?.filter(row => row.hall_id === hall.id)
        return (
          <article key={hall.id} className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            <div className={`relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-4 text-white ${hallTone(hall.slug).solid}`}>
              <Heading className="font-display text-xl font-bold"><Link to={`/halls/${hall.slug}`} className="after:absolute after:inset-0 hover:underline">{hall.name}</Link></Heading>
              {hallRows && now !== undefined && <StatusPill status={hallStatus(hallRows, now)} />}
            </div>
            {hallRows && (list ? <MealList rows={hallRows} now={now} /> : <div className="px-3 py-3"><MealTimes rows={hallRows} now={now} /></div>)}
          </article>
        )
      })}
    </div>
  )
}

const weekColumns = 'sm:grid-cols-[9rem_minmax(0,1fr)]'

// One hall's coming week: days with identical hours share a row, today always stands alone.
export function WeekTable({ rows, dates, today, now }: { rows: Hours[]; dates: string[]; today: string; now: number }) {
  return (
    <div>
      <div aria-hidden="true" className="hidden grid-cols-[9rem_repeat(3,minmax(0,1fr))] gap-4 border-b border-line px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted sm:grid">
        <span />
        {meals.map(meal => <span key={meal} className="flex items-center gap-1.5"><MealIcon meal={meal} size={14} />{meal}</span>)}
      </div>
      <ol className="divide-y divide-line">
        {groupDays(dates, rows, today).map(group => {
          const first = group.dates[0]
          const isToday = first === today
          const label = isToday ? 'Today' : group.dates.length === 1 ? formatWeekday(first) : `${formatWeekday(first)}–${formatWeekday(group.dates[group.dates.length - 1])}`
          return (
            <li key={first} className={`px-5 py-4 sm:grid sm:items-center sm:gap-4 sm:py-3 ${weekColumns} ${isToday ? 'bg-orange-50/70 dark:bg-orange-400/10' : ''}`}>
              <p className="font-semibold">{label}</p>
              <dl className="mt-2 space-y-1.5 text-sm sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
                {meals.map(meal => {
                  const row = group.rows.find(entry => entry.meal === meal)
                  const hours = hoursLabel(row)
                  const live = isToday && row !== undefined && mealStatus(row, now) === 'open'
                  return (
                    <div key={meal} className="flex min-w-0 items-center justify-between gap-3 sm:justify-start sm:gap-2">
                      <dt className="flex items-center gap-2 text-muted"><MealIcon meal={meal} size={16} /><span className="sm:sr-only">{meal}</span></dt>
                      <dd className={`whitespace-nowrap tabular-nums ${live ? 'font-semibold text-emerald-700 dark:text-emerald-300' : hours === 'Closed' || hours === 'TBD' ? 'text-muted' : 'font-medium text-ink'}`}>{hours}{live && <span className="ml-1.5 text-xs">· Now</span>}</dd>
                    </div>
                  )
                })}
              </dl>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
