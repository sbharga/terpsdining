import { Link } from 'react-router'
import { useHalls, useHours, usePopular } from '../api/queries'
import { ErrorNote, ItemCard, Loading, PageTitle } from '../components/UI'
import { formatDay, nowMinutesET, todayET } from '../lib/dates'
import { formatTime, hallStatus, meals } from '../lib/hours'

export default function Home() {
  const today = todayET()
  const halls = useHalls()
  const hours = useHours(today, today)
  const popular = usePopular(today)
  const now = nowMinutesET()

  return (
    <>
      <PageTitle title="Today" />
      <h1 className="text-3xl font-semibold tracking-tight">Today · {formatDay(today)}</h1>

      <section className="mt-6" aria-label="Dining halls">
        {hours.isError && <ErrorNote retry={hours.refetch} />}
        {halls.isError ? <ErrorNote retry={halls.refetch} /> : halls.isPending ? <Loading /> : (
          <>
            {hours.isPending && <Loading />}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {halls.data?.map(hall => {
                const rows = (hours.data ?? []).filter(row => row.hall_id === hall.id)
                return (
                  <Link
                    key={hall.id}
                    to={`/halls/${hall.slug}`}
                    className="rounded-xl border border-zinc-200 p-5 transition-colors hover:border-red-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600"
                  >
                    <h2 className="text-lg font-semibold">{hall.name}</h2>
                    {hours.isSuccess && (
                      <>
                        <p className="mt-1 text-sm text-zinc-600">{hallStatus(rows, now).label}</p>
                        <dl className="mt-5 space-y-2 text-sm">
                          {meals.map(meal => {
                            const row = rows.find(row => row.meal === meal)
                            const label = row?.status === 'open' && row.opens && row.closes
                              ? `${formatTime(row.opens)}–${formatTime(row.closes)}`
                              : row?.status === 'closed' ? 'Closed' : 'TBD'
                            return (
                              <div key={meal} className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                                <dt>{meal}</dt>
                                <dd className="text-zinc-600">{label}</dd>
                              </div>
                            )
                          })}
                        </dl>
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section className="mt-10" aria-labelledby="popular-heading">
        <h2 id="popular-heading" className="text-xl font-semibold">Top rated today</h2>
        <div className="mt-4">
          {popular.isError ? <ErrorNote retry={popular.refetch} /> : popular.isPending ? <Loading /> : popular.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {popular.data.map(item => {
                const locations = Array.isArray(item.halls) ? item.halls : []
                const names = [...new Set(locations.flatMap(hall =>
                  hall !== null && typeof hall === 'object' && !Array.isArray(hall) && typeof hall.name === 'string'
                    ? [hall.name] : [],
                ))]
                return (
                  <ItemCard key={item.id} item={item}>
                    {names.length > 0 && <p className="mt-2 text-sm text-zinc-600">{names.join(' · ')}</p>}
                  </ItemCard>
                )
              })}
            </div>
          ) : <p className="text-zinc-600">No ratings yet today.</p>}
        </div>
      </section>
    </>
  )
}
