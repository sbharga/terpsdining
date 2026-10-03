import { Link, useSearchParams } from 'react-router'
import { useHalls, useHours } from '../api/queries'
import { DatePager, ErrorNote, Loading, PageTitle } from '../components/UI'
import { addDays, formatDay, todayET } from '../lib/dates'
import { formatTime, meals } from '../lib/hours'

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
      <h1 className="text-3xl font-semibold tracking-tight">Hours</h1>
      <div className="mt-6"><DatePager date={start} onChange={changeStart} step={7} /></div>
      <p className="mt-2 text-sm text-zinc-600">{formatDay(start)} – {formatDay(dates[6])}</p>

      <div className="mt-6 space-y-4">
        {halls.isError && <ErrorNote retry={halls.refetch} />}
        {hours.isError && <ErrorNote retry={hours.refetch} />}
        {(halls.isPending || hours.isPending) && <Loading />}
      </div>

      {halls.isSuccess && hours.isSuccess && halls.data?.map(hall => (
        <section key={hall.id} className="mt-10" aria-labelledby={`hours-${hall.slug}`}>
          <h2 id={`hours-${hall.slug}`} className="text-xl font-semibold">
            <Link to={`/halls/${hall.slug}`} className="hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600">{hall.name}</Link>
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[540px] border-collapse text-left text-sm">
              <caption className="sr-only">{hall.name} hours, {formatDay(start)} through {formatDay(dates[6])}</caption>
              <thead className="bg-zinc-50">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  {meals.map(meal => <th key={meal} scope="col" className="px-4 py-3 font-semibold">{meal}</th>)}
                </tr>
              </thead>
              <tbody>
                {dates.map(date => (
                  <tr key={date} className={`border-t border-zinc-200 ${date === today ? 'bg-red-50' : ''}`}>
                    <th scope="row" className="whitespace-nowrap px-4 py-3 font-medium">
                      <time dateTime={date}>{formatDay(date)}</time>
                      {date === today && <span className="ml-2 text-xs font-semibold text-red-700">Today</span>}
                    </th>
                    {meals.map(meal => {
                      const row = hours.data?.find(row => row.hall_id === hall.id && row.date === date && row.meal === meal)
                      const label = row?.status === 'open' && row.opens && row.closes
                        ? `${formatTime(row.opens)}–${formatTime(row.closes)}`
                        : row?.status === 'closed' ? 'Closed' : 'TBD'
                      return <td key={meal} className="whitespace-nowrap px-4 py-3 text-zinc-600">{label}</td>
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
