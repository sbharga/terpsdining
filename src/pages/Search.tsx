import { useSearchParams } from 'react-router'
import { CircleCheck, Clock, Search as SearchIcon, SearchX } from 'lucide-react'
import { useFavoriteIds, useSearch, useSession } from '../api/queries'
import { EmptyState, ErrorNote, ItemCard, Loading, PageTitle } from '../components/UI'
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
  const { session } = useSession()
  const favoriteIds = useFavoriteIds(session?.user.id)
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const results = useSearch(query, todayET())
  const shortDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
  return (
    <section>
      <PageTitle title="Search" />
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Search</h1>
      {query.trim().length >= 2 && results.data && <p className="mt-2 text-muted">{results.data.length} {results.data.length === 1 ? 'result' : 'results'} for “{query.trim()}”</p>}
      {query.trim().length < 2 ? (
        <EmptyState icon={SearchIcon} title="Find a dish">Type 2+ characters to search every hall's menu.</EmptyState>
      ) : results.isError ? (
        <ErrorNote retry={results.refetch} />
      ) : results.isPending ? (
        <Loading />
      ) : results.data?.length ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-busy={results.isFetching}>
            {results.data.map(item => {
              const served = todayStatus(item.halls)
              return (
                <ItemCard key={item.id} item={item} favorite={favoriteIds.has(item.id)}>
                  {served ? (
                    <p className="mt-2 flex items-start gap-1 text-xs font-medium leading-relaxed text-emerald-700 dark:text-emerald-300"><CircleCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{served}</p>
                  ) : (
                    <p className="mt-2 flex items-start gap-1 text-xs leading-relaxed text-muted"><Clock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{item.last_seen
                      ? `Last served ${shortDate.format(new Date(`${item.last_seen}T12:00:00Z`))}`
                      : 'Not served yet'}</p>
                  )}
                </ItemCard>
              )
            })}
          </div>
        </>
      ) : (
        <EmptyState icon={SearchX} title="No matches">Nothing found for “{query.trim()}”. Try a shorter word.</EmptyState>
      )}
    </section>
  )
}

