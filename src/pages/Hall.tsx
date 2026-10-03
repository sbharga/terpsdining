import { useParams, useSearchParams } from 'react-router'
import { useHallMenu, useHalls, useHours, usePopular } from '../api/queries'
import { DatePager, ErrorNote, ItemCard, Loading, NotFound, PageTitle } from '../components/UI'
import type { Database } from '../lib/database.types'
import { nowMinutesET, todayET } from '../lib/dates'
import { defaultMeal, formatTime, hallStatus, meals } from '../lib/hours'
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

  return (
    <>
      <PageTitle title={hall.name} />
      <h1 className="text-3xl font-semibold tracking-tight">{hall.name}</h1>
      {date === today && hours.isSuccess && <p className="mt-2 text-zinc-600">{hallStatus(rows, nowMinutesET()).label}</p>}
      <div className="mt-6"><DatePager date={date} onChange={date => updateParam('date', date)} /></div>

      {hours.isError && <ErrorNote retry={hours.refetch} />}

      <div className="mt-8 flex gap-2" role="group" aria-label="Meal">
        {meals.map(value => {
          const row = rows.find(row => row.meal === value)
          const label = row?.status === 'open' && row.opens && row.closes
            ? `${formatTime(row.opens)}–${formatTime(row.closes)}`
            : row?.status === 'closed' ? 'Closed' : 'TBD'
          return (
            <button
              key={value}
              type="button"
              aria-pressed={meal === value}
              onClick={() => updateParam('meal', value)}
              className={`min-w-0 flex-1 rounded-xl border px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${meal === value ? 'border-red-600 bg-red-50 text-red-700' : 'border-zinc-200 hover:bg-zinc-50'}`}
            >
              <span className="block font-semibold">{value}</span>
              <span className="mt-1 block text-xs">{hours.isSuccess ? label : '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Diet">
          {diets.map(tag => (
            <button
              key={tag.value}
              type="button"
              aria-pressed={diet.includes(tag.value)}
              onClick={() => toggleFilter('diet', tag.value)}
              className={`rounded-full border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${diet.includes(tag.value) ? 'border-green-700 bg-green-50 text-green-800' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
            >{tag.label}</button>
          ))}
        </div>
        {(allergens.length > 0 || avoid.length > 0) && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Avoid allergens">
            <span className="mr-1 text-sm text-zinc-600">Avoid:</span>
            {[...new Set([...allergens, ...avoid])].map(tag => (
              <button
                key={tag}
                type="button"
                aria-pressed={avoid.includes(tag)}
                onClick={() => toggleFilter('avoid', tag)}
                className={`rounded-full border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${avoid.includes(tag) ? 'border-red-600 bg-red-50 text-red-700' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
              >{tag.replace(/\b\w/g, letter => letter.toUpperCase())}</button>
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
              <h2 id="hall-popular-heading" className="text-xl font-semibold">Top rated</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {topRated.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            </section>
          )}
          {mealRows.length === 0 ? <p className="mt-10 text-zinc-600">No menu posted.</p> : stations.length === 0 ? <p className="mt-10 text-zinc-600">No items match filters.</p> : stations.map(([station, items]) => (
            <section key={station} className="mt-10" aria-label={station}>
              <h2 className="text-xl font-semibold">{station}</h2>
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
