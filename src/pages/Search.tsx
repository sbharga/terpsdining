import { useSearchParams } from 'react-router'
import { useSearch } from '../api/queries'
import { ErrorNote, ItemCard, Loading, PageTitle } from '../components/UI'
import type { Json } from '../lib/database.types'
import { todayET } from '../lib/dates'

const mealOrder = ['Breakfast', 'Lunch', 'Dinner']

function todayStatus(value: Json): string | null {
  if (!Array.isArray(value)) return null
  const halls = new Map<string, { name: string; meals: Set<string> }>()
  for (const entry of value) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue
    if (typeof entry.slug !== 'string' || typeof entry.name !== 'string' || typeof entry.meal !== 'string') continue
    const hall = halls.get(entry.slug) ?? { name: entry.name, meals: new Set<string>() }
    hall.meals.add(entry.meal)
    halls.set(entry.slug, hall)
  }
  if (halls.size === 0) return null
  const labels = Array.from(halls.values()).sort((a, b) => a.name.localeCompare(b.name)).map(hall => {
    const meals = mealOrder.filter(meal => hall.meals.has(meal))
    return `${hall.name} (${meals.join(', ')})`
  })
  return `Today: ${labels.join(' · ')}`
}

export default function Search() {
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const results = useSearch(query, todayET())
  const shortDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })

  return (
    <section>
      <PageTitle title="Search" />
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Search</h1>
      {query.trim().length < 2 ? (
        <p className="mt-4 text-zinc-600">Type 2+ characters.</p>
      ) : results.isError ? (
        <ErrorNote retry={results.refetch} />
      ) : results.isPending ? (
        <Loading />
      ) : results.data?.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-busy={results.isFetching}>
          {results.data.map(item => (
            <ItemCard key={item.id} item={item}>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {todayStatus(item.halls) ?? (item.last_seen
                  ? `Last served ${shortDate.format(new Date(`${item.last_seen}T12:00:00Z`))}`
                  : 'Not served yet')}
              </p>
            </ItemCard>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-zinc-600">No matches.</p>
      )}
    </section>
  )
}
