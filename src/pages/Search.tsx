import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, CircleCheck, Clock, Search as SearchIcon, SearchX } from 'lucide-react'
import { SEARCH_PAGE_SIZE, useFavoriteIds, useSearch, useSession } from '../api/queries'
import { SearchBar } from '../components/Layout'
import { EmptyState, ErrorNote, ItemList, ItemRow, Loading, PageTitle } from '../components/UI'
import type { Json } from '../lib/database.types'
import { formatMonthDay, todayET } from '../lib/dates'
import { meals } from '../lib/hours'
import { pageWindow } from '../lib/pagination'

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
    const orderedMeals = meals.filter(meal => hall.meals.has(meal))
    return `${hall.name} (${orderedMeals.join(', ')})`
  })
  return `Today: ${labels.join(' · ')}`
}

export default function Search() {
  const { session } = useSession()
  const favoriteIds = useFavoriteIds(session?.user.id)
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1)
  const results = useSearch(query, page, todayET())
  const total = results.data?.[0]?.total_count ?? 0
  const totalPages = Math.ceil(total / SEARCH_PAGE_SIZE)
  const pageHref = (n: number) => '/search?' + new URLSearchParams(n > 1 ? { q: query, page: String(n) } : { q: query })
  const pageLinkClass = 'grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-semibold ring-1 ring-line'
  return (
    <section>
      <PageTitle title="Search" />
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Search</h1>
      <div className="mt-4"><SearchBar large /></div>
      {query.trim().length >= 2 && results.data && <p className="mt-2 text-muted">{total} {total === 1 ? 'result' : 'results'} for “{query.trim()}”{totalPages > 1 && <> · Page {page} of {totalPages}</>}</p>}
      {query.trim().length < 2 ? (
        <EmptyState icon={SearchIcon} title="Find a dish">Type 2+ characters to search every hall's menu.</EmptyState>
      ) : results.isError ? (
        <ErrorNote retry={results.refetch} />
      ) : results.isPending ? (
        <Loading />
      ) : results.data?.length ? (
        <>
          <div className="mt-6" aria-busy={results.isFetching}>
            <ItemList>
              {results.data.map(item => {
                const served = todayStatus(item.halls)
                return (
                  <ItemRow key={item.id} item={item} favorite={favoriteIds.has(item.id)}>
                    {served ? (
                      <p className="mt-1 flex items-start gap-1.5 text-sm font-medium leading-snug text-emerald-700 dark:text-emerald-300"><CircleCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{served}</p>
                    ) : (
                      <p className="mt-1 flex items-start gap-1.5 text-sm leading-snug text-muted"><Clock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{item.last_seen
                        ? `Last served ${formatMonthDay(item.last_seen)}`
                        : 'Not served yet'}</p>
                    )}
                  </ItemRow>
                )
              })}
            </ItemList>
          </div>
          {totalPages > 1 && <nav aria-label="Search pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {page > 1
              ? <Link to={pageHref(page - 1)} aria-label="Previous page" className={`${pageLinkClass} bg-surface text-muted hover:text-ink`}><ChevronLeft size={18} aria-hidden="true" /></Link>
              : <span aria-label="Previous page" aria-disabled="true" className={`${pageLinkClass} bg-surface text-muted opacity-50`}><ChevronLeft size={18} aria-hidden="true" /></span>}
            {pageWindow(page, totalPages).map((entry, index) => entry === 'gap'
              ? <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted">…</span>
              : <Link key={entry} to={pageHref(entry)} aria-current={entry === page ? 'page' : undefined} className={`${pageLinkClass} ${entry === page ? 'bg-brand text-brand-ink ring-0' : 'bg-surface text-muted hover:text-ink'}`}>{entry}</Link>)}
            {page < totalPages
              ? <Link to={pageHref(page + 1)} aria-label="Next page" className={`${pageLinkClass} bg-surface text-muted hover:text-ink`}><ChevronRight size={18} aria-hidden="true" /></Link>
              : <span aria-label="Next page" aria-disabled="true" className={`${pageLinkClass} bg-surface text-muted opacity-50`}><ChevronRight size={18} aria-hidden="true" /></span>}
          </nav>}
        </>
      ) : page > 1 ? (
        <EmptyState icon={SearchX} title="No more results"><Link className="font-semibold text-brand underline underline-offset-4" to={pageHref(1)}>Back to first page</Link></EmptyState>
      ) : (
        <EmptyState icon={SearchX} title="No matches">Nothing found for “{query.trim()}”. Try a shorter word.</EmptyState>
      )}
    </section>
  )
}
