import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Ban, ChevronDown, Clock, Heart, ListFilter, Soup, Trophy, X } from 'lucide-react'
import { useFavoriteIds, useHallMenu, useHours, useSession } from '../api/queries'
import { DatePager, DietIcon, EmptyState, ErrorNote, ItemList, ItemRow, Loading, MealIcon, NotFound, PageTitle, SectionHeading, StatusPill } from '../components/UI'
import { WeekChart } from '../components/HoursViz'
import { halls, type Hall } from '../lib/halls'
import { addDays, nowMinutesET, parseDateParam, todayET } from '../lib/dates'
import { defaultMeal, hallStatus, hoursLabel, meals } from '../lib/hours'
import { dietTone, hallTone, mealTones, nameTone, tones } from '../lib/theme'
import { filterItems, groupByStation, pickFavorites, rankTopRated } from '../lib/menu'

const diets = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'halal', label: 'Halal' },
]

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
  const date = parseDateParam(params.get('date'), today)
  const hours = useHours(date, date)
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(today, index))
  const weekHours = useHours(today, weekDates[6])
  const menu = useHallMenu(hall.id, date)
  const rows = (hours.data ?? []).filter(row => row.hall_id === hall.id)
  const meal = meals.find(value => value === params.get('meal')) ?? defaultMeal(rows, nowMinutesET(), date === today)
  const diet = (params.get('diet') ?? '').split(',').filter(Boolean)
  const avoid = (params.get('avoid') ?? '').split(',').filter(Boolean)
  const mealRows = (menu.data ?? []).flatMap(row => row.meal === meal && row.item ? [{ station: row.station, item: row.item }] : [])
  const allergens = [...new Set(mealRows.flatMap(row => row.item.allergens))].sort((a, b) => a.localeCompare(b))
  const filteredItems = filterItems(mealRows.map(row => row.item), { diet, avoid })
  const favoriteItems = pickFavorites(filteredItems, favoriteIds)
  const filteredIds = new Set(filteredItems.map(item => item.id))
  const stations = groupByStation(mealRows.filter(row => filteredIds.has(row.item.id)))
  const topRated = rankTopRated(filteredItems, 5)
  const jumps = menu.isSuccess && hours.isSuccess ? [
    ...(favoriteItems.length ? [{ id: 'hall-favorites', label: 'Favorites' }] : []),
    ...(topRated.length ? [{ id: 'hall-popular', label: 'Top rated' }] : []),
    ...stations.map(([station], index) => ({ id: `station-${index}`, label: station })),
  ] : []
  const [avoidOpen, setAvoidOpen] = useState(false)

  function updateParam(key: string, value: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { preventScrollReset: true })
  }

  function toggleFilter(key: 'diet' | 'avoid', value: string) {
    const selected = key === 'diet' ? diet : avoid
    updateParam(key, (selected.includes(value) ? selected.filter(tag => tag !== value) : [...selected, value]).join(','))
  }

  function clearFilters() {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      next.delete('diet')
      next.delete('avoid')
      return next
    }, { preventScrollReset: true })
  }

  return (
    <>
      <PageTitle title={hall.name} />
      <header className={`relative overflow-hidden rounded-3xl p-5 text-white sm:p-8 ${hallTone(hall.slug).solid}`}>
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-4 select-none font-display text-[11rem] font-extrabold leading-none text-white/10">{hall.name.charAt(0)}</span>
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white"><ArrowLeft size={16} aria-hidden="true" />All halls</Link>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{`${hall.name} Dining Hall`}</h1>
          {date === today && hours.isSuccess && <div className="mt-3"><StatusPill status={hallStatus(rows, nowMinutesET())} /></div>}
          <div className="mt-4"><DatePager date={date} onChange={date => updateParam('date', date)} /></div>
        </div>
      </header>

      {hours.isError && <ErrorNote retry={hours.refetch} />}

      <div className="sticky top-14 z-20 -mx-4 mt-4 border-b border-line bg-canvas/90 px-4 py-2 backdrop-blur-md">
        <div role="group" aria-label="Meal" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1">
          {meals.map(value => {
            const row = rows.find(row => row.meal === value)
            return (
              <button
                key={value}
                type="button"
                aria-pressed={meal === value}
                onClick={() => updateParam('meal', value)}
                className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-sm transition ${meal === value ? `${tones[mealTones[value]].solid} text-white shadow-sm` : 'text-muted hover:bg-surface/60 hover:text-ink'}`}
              >
                <span className="flex items-center gap-1.5 font-semibold"><MealIcon meal={value} className={meal === value ? 'text-white' : undefined} />{value}</span>
                <span className="text-xs tabular-nums opacity-80">{hours.isSuccess ? hoursLabel(row) : '—'}</span>
              </button>
            )
          })}
        </div>
        {jumps.length > 1 && (
          <nav aria-label="Jump to section" className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
            {jumps.map(jump => <button key={jump.id} type="button" onClick={() => jumpTo(jump.id)} className="shrink-0 whitespace-nowrap rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-line hover:text-ink">{jump.label}</button>)}
          </nav>
        )}
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4">
        <div role="group" aria-label="Diet" className="flex shrink-0 gap-2">
          {diets.map(tag => (
            <button
              key={tag.value}
              type="button"
              aria-pressed={diet.includes(tag.value)}
              onClick={() => toggleFilter('diet', tag.value)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition ${diet.includes(tag.value) ? `${dietTone(tag.value).soft} ${dietTone(tag.value).border}` : 'border-line bg-surface text-muted hover:text-ink'}`}
            ><DietIcon tag={tag.value} size={14} />{tag.label}</button>
          ))}
        </div>
        {(allergens.length > 0 || avoid.length > 0) && (
          <>
            <span aria-hidden="true" className="h-6 w-px shrink-0 bg-line" />
            <button
              type="button"
              aria-expanded={avoidOpen}
              aria-controls="avoid-panel"
              onClick={() => setAvoidOpen(!avoidOpen)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition ${avoid.length ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200' : 'border-line bg-surface text-muted hover:text-ink'}`}
            ><Ban size={14} aria-hidden="true" />Avoid{avoid.length > 0 && ` · ${avoid.length}`}<ChevronDown size={14} aria-hidden="true" className={`transition ${avoidOpen ? 'rotate-180' : ''}`} /></button>
          </>
        )}
        {(diet.length > 0 || avoid.length > 0) && <button type="button" onClick={clearFilters} className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand hover:bg-surface"><X size={14} aria-hidden="true" />Clear</button>}
      </div>
      {avoidOpen && (
        <div id="avoid-panel" role="group" aria-label="Avoid allergens" className="mt-2 flex flex-wrap gap-2 rounded-2xl bg-surface p-3 ring-1 ring-line">
          {[...new Set([...allergens, ...avoid])].map(tag => (
            <button
              key={tag}
              type="button"
              aria-pressed={avoid.includes(tag)}
              onClick={() => toggleFilter('avoid', tag)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${avoid.includes(tag) ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200' : 'border-line bg-surface text-muted hover:text-ink'}`}
            >{avoid.includes(tag) && <Ban size={14} aria-hidden="true" />}{tag.replace(/\b\w/g, letter => letter.toUpperCase())}</button>
          ))}
        </div>
      )}

      {menu.isError ? <div className="mt-8"><ErrorNote retry={menu.refetch} /></div> : menu.isPending || hours.isPending ? <div className="mt-8"><Loading /></div> : (
        <>
          {favoriteItems.length > 0 && <section id="hall-favorites" className="mt-8 scroll-mt-44" aria-labelledby="hall-favorites-heading"><SectionHeading id="hall-favorites-heading" icon={Heart} tone={tones.berry}>Your favorites</SectionHeading><div className="mt-3"><ItemList>{favoriteItems.map(item => <ItemRow key={item.id} item={item} favorite />)}</ItemList></div></section>}
          {topRated.length > 0 && (
            <section id="hall-popular" className="mt-8 scroll-mt-44" aria-labelledby="hall-popular-heading">
              <SectionHeading id="hall-popular-heading" icon={Trophy} tone={tones.citrus}>Top rated</SectionHeading>
              <div className="mt-3">
                <ItemList>{topRated.map(item => <ItemRow key={item.id} item={item} favorite={favoriteIds.has(item.id)} />)}</ItemList>
              </div>
            </section>
          )}
          {mealRows.length === 0 ? <EmptyState icon={Soup} title="No menu posted">Try another meal or day.</EmptyState> : stations.length === 0 ? <EmptyState icon={ListFilter} title="No items match filters"><button type="button" onClick={clearFilters} className="font-semibold text-brand underline underline-offset-4">Clear filters</button></EmptyState> : stations.map(([station, items], index) => (
            <section key={station} id={`station-${index}`} className="mt-8 scroll-mt-44" aria-label={station}>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold sm:text-xl"><span aria-hidden="true" className={`h-3 w-3 rounded-full ${nameTone(station).dot}`} />{station}<span className="text-sm font-medium text-muted">{items.length}<span className="sr-only"> items</span></span></h2>
              <div className="mt-3">
                <ItemList>{items.map(item => <ItemRow key={item.id} item={item} favorite={favoriteIds.has(item.id)} />)}</ItemList>
              </div>
            </section>
          ))}
        </>
      )}

      <section className="mt-10" aria-labelledby="hall-hours-heading">
        <SectionHeading id="hall-hours-heading" icon={Clock} tone={hallTone(hall.slug)}>{`${hall.name} Dining Hall hours this week`}</SectionHeading>
        {weekHours.isError ? <ErrorNote retry={weekHours.refetch} /> : weekHours.isPending ? <Loading inline /> : <div className="mt-4 overflow-hidden rounded-3xl bg-surface ring-1 ring-line"><WeekChart hall={hall} dates={weekDates} rows={weekHours.data} today={today} now={nowMinutesET()} /></div>}
      </section>
    </>
  )
}
