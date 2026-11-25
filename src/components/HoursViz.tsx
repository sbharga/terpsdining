import { Link } from 'react-router'
import { formatWeekday } from '../lib/dates'
import type { Hall } from '../lib/halls'
import { groupDays, hoursLabel, meals, mealStatus, type Hours } from '../lib/hours'
import { cardClass, hallTone, overlineClass } from '../lib/theme'
import { MealIcon } from './UI'

function NowBadge() {
  return <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">Now</span>
}

// The three meals as full-width rows: the open meal gets a Now badge, past meals are muted.
function MealList({ rows, now }: { rows: Hours[]; now?: number }) {
  return (
    <dl className="divide-y divide-line">
      {meals.map(meal => {
        const row = rows.find(entry => entry.meal === meal)
        const label = hoursLabel(row)
        const status = row && now !== undefined ? mealStatus(row, now) : undefined
        return (
          <div key={meal} className="flex items-center justify-between gap-3 px-5 py-3">
            <dt className={`flex items-center gap-2.5 font-medium ${status === 'past' ? 'text-muted' : ''}`}><MealIcon meal={meal} size={18} />{meal}</dt>
            <dd className={`inline-flex items-center gap-2 whitespace-nowrap tabular-nums ${label === 'Closed' || label === 'TBD' || status === 'past' ? 'text-muted' : 'font-semibold text-ink'}`}>{status === 'open' && <NowBadge />}{label}</dd>
          </div>
        )
      })}
    </dl>
  )
}

// Status band for every hall with its meal times as a full list.
export function HoursBoard({ halls, rows, now, heading: Heading = 'h2' }: { halls: Hall[]; rows?: Hours[]; now?: number; heading?: 'h2' | 'h3' }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {halls.map(hall => {
        const hallRows = rows?.filter(row => row.hall_id === hall.id)
        return (
          <article key={hall.id} className={`overflow-hidden ${cardClass}`}>
            <div className={`relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-4 text-on-tone ${hallTone(hall.slug).solid}`}>
              <Heading className="font-display text-xl font-bold"><Link to={`/halls/${hall.slug}`} className="after:absolute after:inset-0 hover:underline">{hall.name}</Link></Heading>
            </div>
            {hallRows && <MealList rows={hallRows} now={now} />}
          </article>
        )
      })}
    </div>
  )
}

const weekColumns = 'sm:grid-cols-[9rem_minmax(0,1fr)]'

// One hall's coming week: days with identical hours share a row, today always stands alone.
export function WeekTable({ rows, dates, today, now }: { rows: Hours[]; dates: string[]; today: string; now?: number }) {
  return (
    <div>
      <div aria-hidden="true" className={`hidden grid-cols-[9rem_repeat(3,minmax(0,1fr))] gap-4 border-b border-line px-5 py-2.5 sm:grid ${overlineClass}`}>
        <span />
        {meals.map(meal => <span key={meal} className="flex items-center gap-1.5"><MealIcon meal={meal} size={14} />{meal}</span>)}
      </div>
      <ol className="divide-y divide-line">
        {groupDays(dates, rows, today).map(group => {
          const first = group.dates[0]
          const isToday = first === today
          const label = isToday ? 'Today' : group.dates.length === 1 ? formatWeekday(first) : `${formatWeekday(first)}–${formatWeekday(group.dates[group.dates.length - 1])}`
          return (
            <li key={first} className={`px-5 py-4 sm:grid sm:items-center sm:gap-4 sm:py-3 ${weekColumns}`}>
              <p className="font-semibold">{label}</p>
              <dl className="mt-2 space-y-1.5 text-sm sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
                {meals.map(meal => {
                  const row = group.rows.find(entry => entry.meal === meal)
                  const hours = hoursLabel(row)
                  const live = isToday && row !== undefined && now !== undefined && mealStatus(row, now) === 'open'
                  return (
                    <div key={meal} className="flex min-w-0 items-center justify-between gap-3 sm:justify-start sm:gap-2">
                      <dt className="flex items-center gap-2 text-muted sm:sr-only"><MealIcon meal={meal} size={16} /><span>{meal}</span></dt>
                      <dd className={`inline-flex items-center gap-2 whitespace-nowrap tabular-nums ${live || !(hours === 'Closed' || hours === 'TBD') ? 'font-semibold text-ink' : 'text-muted'}`}>{live && <NowBadge />}{hours}</dd>
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
