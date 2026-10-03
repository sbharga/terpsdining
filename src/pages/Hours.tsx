import { Link, useSearchParams } from 'react-router'
import { useHalls, useHours } from '../api/queries'
import { DatePager, ErrorNote, Loading, MealIcon, PageTitle } from '../components/UI'
import { addDays, formatDay, todayET } from '../lib/dates'
import { hoursLabel, meals } from '../lib/hours'
import { hallTone } from '../lib/theme'

export default function Hours() {
  const [params, setParams] = useSearchParams()
  const today = todayET()
  const requestedStart = params.get('start')
  const start = requestedStart && /^\d{4}-\d{2}-\d{2}$/.test(requestedStart) && !Number.isNaN(Date.parse(`${requestedStart}T12:00:00Z`))
    ? requestedStart : today
  const dates = Array.from({ length: 7 }, (_, index) => addDays(start, index))
  const halls = useHalls()
  const hours = useHours(start, dates[6])

  function changeStart(date: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      next.set('start', date)
      return next
    })
  }

  return (
    <>
      <PageTitle title="Hours" />
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Hours</h1>
      <p className="mt-2 text-muted">Meal times for every dining hall, a week at a glance.</p>
      <div className="mt-6"><DatePager date={start} onChange={changeStart} step={7} /></div>
      <p className="mt-2 text-sm text-muted">{formatDay(start)} – {formatDay(dates[6])}</p>

      <div className="mt-6 space-y-4">
        {halls.isError && <ErrorNote retry={halls.refetch} />}
        {hours.isError && <ErrorNote retry={hours.refetch} />}
        {(halls.isPending || hours.isPending) && <Loading />}
      </div>

      {halls.isSuccess && hours.isSuccess && halls.data?.map(hall => (
        <section key={hall.id} className="mt-8 overflow-hidden rounded-3xl bg-surface shadow-stack ring-1 ring-line" aria-labelledby={`hours-${hall.slug}`}>
          <h2 id={`hours-${hall.slug}`} className="flex items-center gap-3 px-5 py-4 font-display text-xl font-bold">
            <span aria-hidden="true" className={`h-3 w-3 rounded-full ${hallTone(hall.slug).dot}`} /><Link to={`/halls/${hall.slug}`} className="hover:text-brand">{hall.name}</Link>
          </h2>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[540px] border-collapse text-left text-sm">
              <caption className="sr-only">{hall.name} hours, {formatDay(start)} through {formatDay(dates[6])}</caption>
              <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  {meals.map(meal => <th key={meal} scope="col" className="px-4 py-3 font-semibold"><span className="inline-flex items-center gap-1.5"><MealIcon meal={meal} size={14} />{meal}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {dates.map(date => (
                  <tr key={date} className={`border-t border-line ${date === today ? 'bg-orange-50/70 dark:bg-orange-400/10' : ''}`}>
                    <th scope="row" className="whitespace-nowrap px-4 py-3 font-medium">
                      <time dateTime={date}>{formatDay(date)}</time>
                      {date === today && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-brand-ink">Today</span>}
                    </th>
                    {meals.map(meal => {
                      const row = hours.data?.find(row => row.hall_id === hall.id && row.date === date && row.meal === meal)
                      const label = hoursLabel(row)
                      return <td key={meal} className={`whitespace-nowrap px-4 py-3 tabular-nums ${label === 'Closed' || label === 'TBD' ? 'text-muted' : 'font-medium text-ink'}`}>{label}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  )
}
