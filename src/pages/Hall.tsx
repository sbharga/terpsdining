import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ChevronDown, Clock, Heart, ListFilter, Soup, Trophy } from 'lucide-react'
import { useFavoriteIds, useHallMenu, useHours, useSession } from '../api/queries'
import { DatePager, EmptyState, ErrorNote, ItemList, ItemRow, Loading, MealIcon, NotFound, PageTitle, SectionHeading, StatusPill } from '../components/UI'
import { FiltersButton, FiltersPanel } from '../components/Filters'
import { PlateBar, PlateButton } from '../components/Plate'
import { WeekTable } from '../components/HoursViz'
import { halls, type Hall } from '../lib/halls'
import { addDays, parseDateParam, todayET, useNowMinutesET } from '../lib/dates'
import { defaultMeal, hallStatus, hoursLabel, meals } from '../lib/hours'
import { cardClass, hallTone, linkClass, mealTones, nameTone, titleClass, tones } from '../lib/theme'
import { useFilterParams } from '../lib/filters'
import { filterItems, groupByStation, pickFavorites, rankTopRated } from '../lib/menu'

export default function Hall() {
  const { slug } = useParams()
  const hall = halls.find(hall => hall.slug === slug)
  if (!hall) return <NotFound />
  return <HallMenu key={hall.id} hall={hall} />
}
function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

function HallMenu({ hall }: { hall: Hall }) {
  const [params, setParams] = useSearchParams()
  const { session } = useSession()
  const favoriteIds = useFavoriteIds(session?.user.id)
  const today = todayET()
  const now = useNowMinutesET()
  const date = parseDateParam(params.get('date'), today)
  const hours = useHours(date, date)
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(today, index))
  const weekHours = useHours(today, weekDates[6])
  const menu = useHallMenu(hall.id, date)
  const rows = (hours.data ?? []).filter(row => row.hall_id === hall.id)
  const meal = meals.find(value => value === params.get('meal')) ?? defaultMeal(rows, now ?? 0, date === today)
  const filters = useFilterParams()
  const mealRows = (menu.data ?? []).flatMap(row => row.meal === meal && row.item ? [{ station: row.station, item: row.item }] : [])
  const allergens = [...new Set(mealRows.flatMap(row => row.item.allergens))].sort((a, b) => a.localeCompare(b))
  const filteredItems = filterItems(mealRows.map(row => row.item), { diet: filters.diet, avoid: filters.avoid })
  const favoriteItems = pickFavorites(filteredItems, favoriteIds)
  const filteredIds = new Set(filteredItems.map(item => item.id))
  const stations = groupByStation(mealRows.filter(row => filteredIds.has(row.item.id)))
  const topRated = rankTopRated(filteredItems, 5)
  const jumps = menu.isSuccess && hours.isSuccess ? [
    ...(favoriteItems.length ? [{ id: 'hall-favorites', label: 'Favorites' }] : []),
    ...(topRated.length ? [{ id: 'hall-popular', label: 'Top rated' }] : []),
    ...stations.map(([station], index) => ({ id: `station-${index}`, label: station })),
  ] : []
  const [filtersOpen, setFiltersOpen] = useState(false)

  function updateParam(key: string, value: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { preventScrollReset: true })
  }

  return (
    <>
      <PageTitle title={hall.name} />
      <header className={`rounded-3xl p-5 text-white sm:p-8 ${hallTone(hall.slug).solid}`}>
        <Link to="/" className="hit inline-flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white"><ArrowLeft size={16} aria-hidden="true" />All halls</Link>
        <h1 className={`mt-2 ${titleClass}`}>{`${hall.name} Dining Hall`}</h1>
        {date === today && hours.isSuccess && now !== undefined && <div className="mt-3"><StatusPill status={hallStatus(rows, now)} /></div>}
        <div className="mt-4"><DatePager date={date} onChange={date => updateParam('date', date)} /></div>
      </header>

      {hours.isError && <ErrorNote retry={hours.refetch} />}

      <div className="sticky top-14 z-20 -mx-4 mt-4 border-b border-line bg-canvas/90 px-safe py-2 backdrop-blur-md">
        <div role="group" aria-label="Meal" className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
          {meals.map(value => (
            <button
              key={value}
              type="button"
              aria-pressed={meal === value}
              onClick={() => updateParam('meal', value)}
              className={`flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold transition ${meal === value ? `${tones[mealTones[value]].solid} text-white shadow-sm` : 'text-muted hover:text-ink'}`}
            ><span className="hidden min-[380px]:inline-flex"><MealIcon meal={value} className={meal === value ? 'text-white' : undefined} /></span>{value}</button>
          ))}
        </div>
      </div>

      {hours.isSuccess && <p className="mt-5 flex items-center gap-2 text-sm text-muted"><MealIcon meal={meal} /><span><span className="font-semibold text-ink">{meal}</span> · {hoursLabel(rows.find(row => row.meal === meal))}</span></p>}

      <div className="mt-3 flex items-center gap-2">
        {jumps.length > 1 && (
          <div className="relative min-w-0 flex-1">
            <select aria-label="Jump to section" value="" onChange={event => { if (event.target.value) jumpTo(event.target.value) }} className="h-11 w-full appearance-none truncate rounded-full border border-line bg-surface pl-4 pr-10 text-base font-medium text-ink sm:text-sm">
              <option value="" disabled>Jump to station…</option>
              {jumps.map(jump => <option key={jump.id} value={jump.id}>{jump.label}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        )}
        <FiltersButton open={filtersOpen} active={filters.active} onToggle={() => setFiltersOpen(!filtersOpen)} />
      </div>
      {filtersOpen && <FiltersPanel allergens={allergens} filters={filters} />}

      {menu.isError ? <div className="mt-10"><ErrorNote retry={menu.refetch} /></div> : menu.isPending || hours.isPending ? <div className="mt-10"><Loading /></div> : (
        <>
          {favoriteItems.length > 0 && <section id="hall-favorites" className="mt-10 scroll-mt-36" aria-labelledby="hall-favorites-heading"><SectionHeading id="hall-favorites-heading" icon={Heart} tone={tones.berry}>Your favorites</SectionHeading><div className="mt-4"><ItemList>{favoriteItems.map(item => <ItemRow key={item.id} item={item} favorite action={<PlateButton item={item} />} />)}</ItemList></div></section>}
          {topRated.length > 0 && (
            <section id="hall-popular" className="mt-10 scroll-mt-36" aria-labelledby="hall-popular-heading">
              <SectionHeading id="hall-popular-heading" icon={Trophy} tone={tones.citrus}>Top rated</SectionHeading>
              <div className="mt-4">
                <ItemList>{topRated.map(item => <ItemRow key={item.id} item={item} favorite={favoriteIds.has(item.id)} action={<PlateButton item={item} />} />)}</ItemList>
              </div>
            </section>
          )}
          {mealRows.length === 0 ? <EmptyState icon={Soup} title="No menu posted">Try another meal or day.</EmptyState> : stations.length === 0 ? <EmptyState icon={ListFilter} title="No items match filters"><button type="button" onClick={filters.clear} className={`hit ${linkClass}`}>Clear filters</button></EmptyState> : stations.map(([station, items], index) => (
            <section key={station} id={`station-${index}`} className="mt-10 scroll-mt-36" aria-labelledby={`station-${index}-heading`}>
              <SectionHeading id={`station-${index}-heading`} dot={nameTone(station).dot} count={items.length}>{station}</SectionHeading>
              <div className="mt-4">
                <ItemList>{items.map(item => <ItemRow key={item.id} item={item} favorite={favoriteIds.has(item.id)} action={<PlateButton item={item} />} />)}</ItemList>
              </div>
            </section>
          ))}
        </>
      )}

      <section className="mt-10" aria-labelledby="hall-hours-heading">
        <SectionHeading id="hall-hours-heading" icon={Clock} tone={hallTone(hall.slug)}>{`${hall.name} Dining Hall hours this week`}</SectionHeading>
        {weekHours.isError ? <ErrorNote retry={weekHours.refetch} /> : weekHours.isPending ? <Loading inline /> : <div className={`mt-4 overflow-hidden ${cardClass}`}><WeekTable rows={weekHours.data.filter(row => row.hall_id === hall.id)} dates={weekDates} today={today} now={now} /></div>}
      </section>
      <PlateBar />
    </>
  )
}
