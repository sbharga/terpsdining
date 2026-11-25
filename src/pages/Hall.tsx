import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Clock, Heart, ListFilter, Soup, Trophy } from 'lucide-react'
import { useFavoriteIds, useHallMenu, useHours, useSession } from '../api/queries'
import { DatePager, EmptyState, ErrorNote, ItemList, ItemRow, Loading, MealIcon, NotFound, PageTitle, SectionHeading, StatusPill } from '../components/UI'
import { FiltersButton, FiltersPanel } from '../components/Filters'
import { IslandDock } from '../components/Layout'
import { HallMap } from '../components/HallMap'
import { PlateBar, PlateButton } from '../components/Plate'
import { WeekTable } from '../components/HoursViz'
import { halls, type Hall } from '../lib/halls'
import { addDays, parseDateParam, todayET, useNowMinutesET } from '../lib/dates'
import { defaultMeal, hallStatus, hoursLabel, mealWithMenu, meals, type Meal } from '../lib/hours'
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
function MealSwitcher({ meal, onChange, compact = false }: { meal: Meal; onChange: (meal: Meal) => void; compact?: boolean }) {
  return (
    <div role="group" aria-label="Meal" className={`grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1 ${compact ? 'w-full sm:w-auto' : 'sm:w-96'}`}>
      {meals.map(value => (
        <button
          key={value}
          type="button"
          aria-pressed={meal === value}
          onClick={() => onChange(value)}
          className={`flex min-w-0 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition ${compact ? 'hit h-9 px-3' : 'h-11 px-2'} ${meal === value ? `${tones[mealTones[value]].solid} text-on-tone shadow-sm` : 'text-muted hover:text-ink'}`}
        ><span className={compact ? 'inline-flex' : 'hidden min-[380px]:inline-flex'}><MealIcon meal={value} className={meal === value ? 'text-on-tone' : undefined} /></span><span className={compact ? 'max-sm:sr-only' : undefined}>{value}</span></button>
      ))}
    </div>
  )
}

function HallMenu({ hall }: { hall: Hall }) {
  const [params, setParams] = useSearchParams()
  const { session } = useSession()
  const favoriteIds = useFavoriteIds(session?.user.id)
  const today = todayET()
  const now = useNowMinutesET()
  const date = parseDateParam(params.get('date'), today)
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(today, index))
  const inWeek = date >= today && date <= weekDates[6]
  const weekHours = useHours(today, weekDates[6])
  const dayHours = useHours(date, date, !inWeek)
  const hours = inWeek ? weekHours : dayHours
  const menu = useHallMenu(hall.id, date)
  const rows = (hours.data ?? []).filter(row => row.hall_id === hall.id && row.date === date)
  const menuMeals = new Set((menu.data ?? []).flatMap(row => row.item ? [row.meal] : []))
  const meal = meals.find(value => value === params.get('meal')) ?? mealWithMenu(defaultMeal(rows, now ?? 0, date === today), menuMeals)
  const filters = useFilterParams()
  const mealRows = (menu.data ?? []).flatMap(row => row.meal === meal && row.item ? [{ station: row.station, item: row.item }] : [])
  const allergens = [...new Set(mealRows.flatMap(row => row.item.allergens))].sort((a, b) => a.localeCompare(b))
  const filteredItems = filterItems(mealRows.map(row => row.item), { diet: filters.diet, avoid: filters.avoid })
  const favoriteItems = pickFavorites(filteredItems, favoriteIds)
  const filteredIds = new Set(filteredItems.map(item => item.id))
  const stations = groupByStation(mealRows.filter(row => filteredIds.has(row.item.id)))
  const topRated = rankTopRated(filteredItems, 5)
  const mealHours = hoursLabel(rows.find(row => row.meal === meal))
  const showFilters = mealRows.length > 0 || filters.active > 0
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
      <header className={`rounded-3xl p-5 text-on-tone sm:p-8 ${hallTone(hall.slug).solid}`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link to="/" className="hit inline-flex items-center gap-1 text-sm font-medium text-on-tone/80 hover:text-on-tone"><ArrowLeft size={16} aria-hidden="true" />All halls</Link>
          {date === today && hours.isSuccess && now !== undefined && <StatusPill status={hallStatus(rows, now)} />}
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <h1 className={titleClass}>{`${hall.name} Dining Hall`}</h1>
          <DatePager date={date} onChange={date => updateParam('date', date)} />
        </div>
      </header>

      {hours.isError && <ErrorNote retry={hours.refetch} />}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
        <IslandDock island={<MealSwitcher compact meal={meal} onChange={value => updateParam('meal', value)} />}><MealSwitcher meal={meal} onChange={value => updateParam('meal', value)} /></IslandDock>
        <div className="flex min-h-11 flex-1 items-center justify-between gap-3">
          {hours.isSuccess ? <p className="flex items-center gap-2 text-sm text-muted"><Clock size={16} aria-hidden="true" /><span className="sr-only">{meal} hours: </span><span className={mealHours === 'Closed' || mealHours === 'TBD' ? '' : 'font-semibold text-ink tabular-nums'}>{mealHours}</span></p> : <span />}
          {showFilters && <FiltersButton open={filtersOpen} active={filters.active} onToggle={() => setFiltersOpen(!filtersOpen)} />}
        </div>
      </div>
      {filtersOpen && showFilters && <FiltersPanel allergens={allergens} filters={filters} />}
      <HallMap
        slug={hall.slug}
        title={`${hall.name} floor map`}
        stations={menu.isSuccess && hours.isSuccess ? stations.map(([station]) => station) : []}
        onJump={jumpTo}
      />

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
        <SectionHeading id="hall-hours-heading" icon={Clock} tone={hallTone(hall.slug)}>Hours this week</SectionHeading>
        {weekHours.isError ? <ErrorNote retry={weekHours.refetch} /> : weekHours.isPending ? <Loading inline /> : <div className={`mt-4 overflow-hidden ${cardClass}`}><WeekTable rows={weekHours.data.filter(row => row.hall_id === hall.id)} dates={weekDates} today={today} now={now} /></div>}
      </section>
      <PlateBar />
    </>
  )
}
