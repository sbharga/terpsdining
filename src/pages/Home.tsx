import { useFavoriteIds, useFavoriteItems, useHours, usePopular, useSession } from '../api/queries'
import { EmptyState, ErrorNote, ItemCard, Loading, PageTitle, SectionHeading } from '../components/UI'
import { HoursBoard } from '../components/HoursViz'
import { formatDay, nowMinutesET, todayET } from '../lib/dates'
import { halls } from '../lib/halls'
import { tones } from '../lib/theme'
import { CalendarDays, Heart, MapPin, Star, Trophy } from 'lucide-react'
import type { Json } from '../lib/database.types'
function hallNames(value: Json): string[] {
  const locations = Array.isArray(value) ? value : []
  return [...new Set(locations.flatMap(hall =>
    hall !== null && typeof hall === 'object' && !Array.isArray(hall) && typeof hall.name === 'string'
      ? [hall.name] : [],
  ))]
}
export default function Home() {
  const today = todayET()
  const { session } = useSession()
  const favoriteIds = useFavoriteIds(session?.user.id)
  const favorites = useFavoriteItems(today, session?.user.id)
  const hours = useHours(today, today)
  const popular = usePopular(today)
  const now = nowMinutesET()

  return (
    <>
      <PageTitle title="Today" />
      <header className="mb-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-medium text-muted ring-1 ring-line"><CalendarDays size={16} aria-hidden="true" />{formatDay(today)}</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">What's cooking at UMD <span className="text-brand">today</span></h1>
        <p className="mt-2 text-muted">Hours, menus, and top-rated eats across UMD's dining halls.</p>
      </header>

      <section className="mt-6" aria-label="Dining halls">
        {hours.isError && <ErrorNote retry={hours.refetch} />}
        {hours.isPending && <Loading inline />}
        <div className="mt-4"><HoursBoard halls={halls} rows={hours.isSuccess ? hours.data : undefined} now={now} /></div>
      </section>
      {session && !(favorites.isSuccess && favorites.data.length === 0) && <section className="mt-12" aria-labelledby="favorites-heading">
        <SectionHeading id="favorites-heading" icon={Heart} tone={tones.berry}>Your favorites today</SectionHeading>
        <div className="mt-4">{favorites.isError ? <ErrorNote retry={favorites.refetch} /> : favorites.isPending ? <Loading inline /> : <div className="grid gap-4 sm:grid-cols-2">{favorites.data.map(item => {
          const names = hallNames(item.halls)
          return <ItemCard key={item.id} item={item} favorite>{names.length > 0 && <p className="mt-2 flex items-center gap-1 text-xs text-muted"><MapPin size={12} aria-hidden="true" />{names.join(' · ')}</p>}</ItemCard>
        })}</div>}</div>
      </section>}

      <section className="mt-12" aria-labelledby="popular-heading">
        <SectionHeading id="popular-heading" icon={Trophy} tone={tones.citrus}>Top rated today</SectionHeading>
        <div className="mt-4">
          {popular.isError ? <ErrorNote retry={popular.refetch} /> : popular.isPending ? <Loading /> : popular.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {popular.data.map(item => {
                const names = hallNames(item.halls)
                return (
                  <ItemCard key={item.id} item={item} favorite={favoriteIds.has(item.id)}>
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
