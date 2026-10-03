import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Ban, ListFilter, Soup, Trophy, X } from 'lucide-react'
import { useHallMenu, useHalls, useHours, usePopular } from '../api/queries'
import { DatePager, DietIcon, EmptyState, ErrorNote, ItemCard, Loading, MealIcon, NotFound, PageTitle, SectionHeading, StatusPill } from '../components/UI'
import type { Database } from '../lib/database.types'
import { nowMinutesET, todayET } from '../lib/dates'
import { defaultMeal, hallStatus, hoursLabel, meals } from '../lib/hours'
import { dietTone, mealTones, nameTone, tones } from '../lib/theme'
import { filterItems, groupByStation } from '../lib/menu'

const diets = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'halal', label: 'Halal' },
]

export default function Hall() {
  const { slug } = useParams()
  const halls = useHalls()

  if (halls.isError) return <><PageTitle title="Dining hall" /><ErrorNote retry={halls.refetch} /></>
  if (halls.isPending) return <><PageTitle title="Dining hall" /><Loading /></>
  const hall = halls.data?.find(hall => hall.slug === slug)
  if (!hall) return <NotFound />
  return <HallMenu key={hall.id} hall={hall} />
}

function HallMenu({ hall }: { hall: Database['public']['Tables']['halls']['Row'] }) {
  const [params, setParams] = useSearchParams()
  const today = todayET()
  const requestedDate = params.get('date')
  const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && !Number.isNaN(Date.parse(`${requestedDate}T12:00:00Z`))
    ? requestedDate : today
  const hours = useHours(date, date)
  const menu = useHallMenu(hall.id, date)
  const popular = usePopular(date, hall.id)
  const rows = (hours.data ?? []).filter(row => row.hall_id === hall.id)
  const meal = meals.find(value => value === params.get('meal')) ?? defaultMeal(rows, nowMinutesET(), date === today)
  const diet = (params.get('diet') ?? '').split(',').filter(Boolean)
  const avoid = (params.get('avoid') ?? '').split(',').filter(Boolean)
  const mealRows = (menu.data ?? []).flatMap(row => row.meal === meal && row.item ? [{ station: row.station, item: row.item }] : [])
  const allergens = [...new Set(mealRows.flatMap(row => row.item.allergens))].sort((a, b) => a.localeCompare(b))
  const filteredItems = filterItems(mealRows.map(row => row.item), { diet, avoid })
  const filteredIds = new Set(filteredItems.map(item => item.id))
  const stations = groupByStation(mealRows.filter(row => filteredIds.has(row.item.id)))
  const topRated = (popular.data ?? []).filter(item => filteredIds.has(item.id))

  function updateParam(key: string, value: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
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
    })
  }

  return (
    <>
      <PageTitle title={hall.name} />
      <header className="rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />All halls</Link>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{hall.name}</h1>
          {date === today && hours.isSuccess && <div className="mt-3"><StatusPill status={hallStatus(rows, nowMinutesET())} /></div>}
          <div className="mt-5"><DatePager date={date} onChange={date => updateParam('date', date)} /></div>
        </div>
      </header>

      {hours.isError && <ErrorNote retry={hours.refetch} />}

      <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1" role="group" aria-label="Meal">
        {meals.map(value => {
          const row = rows.find(row => row.meal === value)
          return (
            <button
              key={value}
              type="button"
              aria-pressed={meal === value}
              onClick={() => updateParam('meal', value)}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-sm transition ${meal === value ? `bg-surface shadow-sm ring-1 ring-line ${tones[mealTones[value]].text}` : 'text-muted hover:bg-surface/60 hover:text-ink'}`}
            >
              <span className="flex items-center gap-1.5 font-semibold"><MealIcon meal={value} />{value}</span>
              <span className="text-xs tabular-nums opacity-80">{hours.isSuccess ? hoursLabel(row) : '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><ListFilter size={16} aria-hidden="true" />Filters</h2>
          {(diet.length > 0 || avoid.length > 0) && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand hover:bg-canvas"><X size={14} aria-hidden="true" />Clear filters</button>}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Diet">
          <span aria-hidden="true" className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">Diet</span>
          {diets.map(tag => (
            <button
              key={tag.value}
              type="button"
              aria-pressed={diet.includes(tag.value)}
              onClick={() => toggleFilter('diet', tag.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${diet.includes(tag.value) ? `${dietTone(tag.value).soft} ${dietTone(tag.value).border}` : 'border-line bg-surface text-muted hover:text-ink'}`}
            ><DietIcon tag={tag.value} size={14} />{tag.label}</button>
          ))}
        </div>
        {(allergens.length > 0 || avoid.length > 0) && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Avoid allergens">
            <span aria-hidden="true" className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">Avoid</span>
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
      </div>

      {popular.isError && <div className="mt-10"><ErrorNote retry={popular.refetch} /></div>}
      {menu.isError ? <div className="mt-10"><ErrorNote retry={menu.refetch} /></div> : menu.isPending || hours.isPending ? <div className="mt-10"><Loading /></div> : (
        <>
          {popular.isPending && <div className="mt-10"><Loading /></div>}
          {!popular.isError && topRated.length > 0 && (
            <section className="mt-10" aria-labelledby="hall-popular-heading">
              <SectionHeading id="hall-popular-heading" icon={Trophy} tone={tones.citrus}>Top rated</SectionHeading>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {topRated.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            </section>
          )}
          {mealRows.length === 0 ? <EmptyState icon={Soup} title="No menu posted">Try another meal or day.</EmptyState> : stations.length === 0 ? <EmptyState icon={ListFilter} title="No items match filters"><button type="button" onClick={clearFilters} className="font-semibold text-brand underline underline-offset-4">Clear filters</button></EmptyState> : stations.map(([station, items]) => (
            <section key={station} className="mt-10" aria-label={station}>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold"><span aria-hidden="true" className={`h-3 w-3 rounded-full ${nameTone(station).dot}`} />{station}<span className="ml-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{items.length}<span className="sr-only"> items</span></span></h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {items.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  )
}
