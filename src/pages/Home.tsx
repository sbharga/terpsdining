import { useFavoriteIds, useFavoriteItems, useHours, usePopular, useSession } from '../api/queries'
import { EmptyState, ErrorNote, ItemList, ItemRow, Loading, PageHeader, PageTitle, SectionHeading } from '../components/UI'
import { HoursBoard } from '../components/HoursViz'
import { formatDay, todayET, useNowMinutesET } from '../lib/dates'
import { halls } from '../lib/halls'
import { tones } from '../lib/theme'
import { Heart, Star, Trophy } from 'lucide-react'
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
  const now = useNowMinutesET()

  return (
    <>
      <PageTitle title="Today" />
      <PageHeader eyebrow={<time dateTime={today} data-nosnippet>{formatDay(today)}</time>} title={<>What's cooking at UMD <span className="text-brand">today</span></>} lead="Hours, menus, and top-rated eats across UMD's dining halls." />

      <section aria-label="Dining halls" data-nosnippet>
        {hours.isError && <ErrorNote retry={hours.refetch} />}
        {hours.isPending && <Loading inline />}
        <HoursBoard halls={halls} rows={hours.isSuccess ? hours.data : undefined} now={now} />
      </section>
      {session && !(favorites.isSuccess && favorites.data.length === 0) && <section className="mt-10" aria-labelledby="favorites-heading">
        <SectionHeading id="favorites-heading" icon={Heart} tone={tones.berry}>Your favorites today</SectionHeading>
        <div className="mt-4">{favorites.isError ? <ErrorNote retry={favorites.refetch} /> : favorites.isPending ? <Loading inline /> : <ItemList>{favorites.data.map(item => {
          const names = hallNames(item.halls)
          return <ItemRow key={item.id} item={item} favorite>{names.length > 0 && <p className="mt-0.5 truncate text-sm text-muted">{names.join(' · ')}</p>}</ItemRow>
        })}</ItemList>}</div>
      </section>}

      <section className="mt-10" aria-labelledby="popular-heading" data-nosnippet>
        <SectionHeading id="popular-heading" icon={Trophy} tone={tones.citrus}>Top rated today</SectionHeading>
        <div className="mt-4">
          {popular.isError ? <ErrorNote retry={popular.refetch} /> : popular.isPending ? <Loading /> : popular.data?.length ? (
            <ItemList>
              {popular.data.map(item => {
                const names = hallNames(item.halls)
                return (
                  <ItemRow key={item.id} item={item} favorite={favoriteIds.has(item.id)}>
                    {names.length > 0 && <p className="mt-0.5 truncate text-sm text-muted">{names.join(' · ')}</p>}
                  </ItemRow>
                )
              })}
            </ItemList>
          ) : <EmptyState icon={Star} title="No ratings yet today">Rate a dish to put it on the board.</EmptyState>}
        </div>
      </section>
    </>
  )
}
