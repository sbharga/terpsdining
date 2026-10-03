import { Link } from 'react-router'
import { useHalls, useHours, usePopular } from '../api/queries'
import { EmptyState, ErrorNote, ItemCard, Loading, MealIcon, PageTitle, SectionHeading, StatusPill } from '../components/UI'
import { formatDay, nowMinutesET, todayET } from '../lib/dates'
import { hallStatus, hoursLabel, meals, mealStatus } from '../lib/hours'
import { tones } from '../lib/theme'
import { CalendarDays, ChevronRight, MapPin, Star, Trophy } from 'lucide-react'

export default function Home() {
  const today = todayET()
  const halls = useHalls()
  const hours = useHours(today, today)
  const popular = usePopular(today)
  const now = nowMinutesET()

  return (
    <>
      <PageTitle title="Today" />
      <header className="mb-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-medium text-muted ring-1 ring-line"><CalendarDays size={16} aria-hidden="true" />{formatDay(today)}</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">What's cooking <span className="text-brand">today</span></h1>
        <p className="mt-2 text-muted">Hours, menus, and top-rated eats across UMD's dining halls.</p>
      </header>

      <section className="mt-6" aria-label="Dining halls">
        {hours.isError && <ErrorNote retry={hours.refetch} />}
        {halls.isError ? <ErrorNote retry={halls.refetch} /> : halls.isPending ? <Loading /> : (
          <>
            {hours.isPending && <Loading inline />}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {halls.data?.map(hall => {
                const rows = (hours.data ?? []).filter(row => row.hall_id === hall.id)
                return (
                  <Link
                    key={hall.id}
                    to={`/halls/${hall.slug}`}
                    className="group flex flex-col rounded-3xl bg-surface p-5 ring-1 ring-line transition hover:-translate-y-1 motion-reduce:transform-none"
                  >
                    <div className="flex items-center gap-3"><h2 className="font-display text-xl font-bold">{hall.name}</h2><ChevronRight size={18} aria-hidden="true" className="ml-auto text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" /></div>
                    {hours.isSuccess && (
                      <>
                        <div className="mt-4"><StatusPill status={hallStatus(rows, now)} /></div>
                        <dl className="mt-4 space-y-1 text-sm">
                          {meals.map(meal => {
                            const row = rows.find(row => row.meal === meal)
                            return (
                              <div key={meal} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${row && mealStatus(row, now) === 'open' ? 'bg-emerald-50 dark:bg-emerald-400/10' : ''}`}>
                                <dt className="flex items-center gap-2 font-medium"><MealIcon meal={meal} />{meal}</dt>
                                <dd className="tabular-nums text-muted">{hoursLabel(row)}</dd>
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

      <section className="mt-12" aria-labelledby="popular-heading">
        <SectionHeading id="popular-heading" icon={Trophy} tone={tones.citrus}>Top rated today</SectionHeading>
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
                    {names.length > 0 && <p className="mt-2 flex items-center gap-1 text-xs text-muted"><MapPin size={12} aria-hidden="true" />{names.join(' · ')}</p>}
                  </ItemCard>
                )
              })}
            </div>
          ) : <EmptyState icon={Star} title="No ratings yet today">Rate a dish to put it on the board.</EmptyState>}
        </div>
      </section>
    </>
  )
}
