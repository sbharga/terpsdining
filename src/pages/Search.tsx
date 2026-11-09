import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, CircleCheck, Clock, ListFilter, SearchX } from 'lucide-react'
import { SEARCH_PAGE_SIZE, useDirectory, useFavoriteIds, useSearch, useSession } from '../api/queries'
import { FiltersButton, FiltersPanel } from '../components/Filters'
import { SearchBar } from '../components/Layout'
import { Disclosure, EmptyState, ErrorNote, ItemList, ItemRow, Loading, PageHeader, PageTitle, SectionHeading } from '../components/UI'
import type { Json } from '../lib/database.types'
import { formatMonthDay, todayET } from '../lib/dates'
import { useFilterParams } from '../lib/filters'
import { meals } from '../lib/hours'
import { pageRange, pageWindow } from '../lib/pagination'
import { buttonClass, cardClass, linkClass } from '../lib/theme'

const allergens = ['alcohol', 'coconut', 'dairy', 'egg', 'fish', 'gluten', 'nuts', 'pea protein', 'pork', 'sesame', 'shellfish', 'soy']

function scrollToResults() {
  document.getElementById('search-results')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

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
  const filters = useFilterParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = params.get('q') ?? ''
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1)
  const results = useSearch(query, page, todayET(), filters)
  const directory = useDirectory(query.trim().length < 2)
  const total = results.data?.[0]?.total_count ?? 0
  const totalPages = Math.ceil(total / SEARCH_PAGE_SIZE)
  const [from, to] = pageRange(page, SEARCH_PAGE_SIZE, total)
  const pageHref = (n: number) => {
    const next = new URLSearchParams(params)
    if (n > 1) next.set('page', String(n))
    else next.delete('page')
    return `/search?${next}`
  }
  return (
    <section>
      <PageTitle title="Search" />
      <PageHeader title="Search" />
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1"><SearchBar large /></div>
        <FiltersButton open={filtersOpen} active={filters.active} onToggle={() => setFiltersOpen(!filtersOpen)} />
      </div>
      {filtersOpen && <FiltersPanel allergens={allergens} filters={filters} />}
      {query.trim().length >= 2 && results.data && <p id="search-results" className="mt-3 scroll-mt-20 text-muted">{totalPages > 1 ? <>Showing {from}–{to} of {total} results for “{query.trim()}”</> : <>{total} {total === 1 ? 'result' : 'results'} for “{query.trim()}”</>}</p>}
      {query.trim().length < 2 ? (
        <section aria-labelledby="directory" className="mt-10">
          <SectionHeading id="directory" count={directory.data?.reduce((sum, group) => sum + group.items.length, 0)}>All dishes A–Z</SectionHeading>
          {directory.isError ? <ErrorNote retry={directory.refetch} /> : directory.isPending ? <Loading /> : (
            <div className={`mt-4 divide-y divide-line px-5 sm:px-6 ${cardClass}`}>
              {directory.data.map(group => (
                <Disclosure key={group.letter} summary={`${group.letter} · ${group.items.length} ${group.items.length === 1 ? 'dish' : 'dishes'}`}>
                  <ul className="grid pb-3 sm:grid-cols-2 sm:gap-x-6">
                    {group.items.map(item => <li key={item.id}><Link to={`/items/${item.id}`} className="flex min-h-11 items-center text-sm font-semibold hover:text-brand">{item.name}</Link></li>)}
                  </ul>
                </Disclosure>
              ))}
            </div>
          )}
        </section>
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
                      <p className="mt-1 flex items-start gap-1.5 text-sm font-medium leading-snug text-success"><CircleCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{served}</p>
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
          {totalPages > 1 && <nav aria-label="Search pages" className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {page > 1
              ? <Link to={pageHref(page - 1)} preventScrollReset onClick={scrollToResults} aria-label="Previous page" className={buttonClass('secondary', 'icon')}><ChevronLeft size={18} aria-hidden="true" /></Link>
              : <span aria-label="Previous page" aria-disabled="true" className={`${buttonClass('secondary', 'icon')} opacity-50`}><ChevronLeft size={18} aria-hidden="true" /></span>}
            {pageWindow(page, totalPages).map((entry, index) => entry === 'gap'
              ? <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted">…</span>
              : <Link key={entry} to={pageHref(entry)} preventScrollReset onClick={scrollToResults} aria-current={entry === page ? 'page' : undefined} className={buttonClass(entry === page ? 'primary' : 'secondary', 'icon')}>{entry}</Link>)}
            {page < totalPages
              ? <Link to={pageHref(page + 1)} preventScrollReset onClick={scrollToResults} aria-label="Next page" className={buttonClass('secondary', 'icon')}><ChevronRight size={18} aria-hidden="true" /></Link>
              : <span aria-label="Next page" aria-disabled="true" className={`${buttonClass('secondary', 'icon')} opacity-50`}><ChevronRight size={18} aria-hidden="true" /></span>}
          </nav>}
        </>
      ) : page > 1 ? (
        <EmptyState icon={SearchX} title="No more results"><Link className={`hit ${linkClass}`} to={pageHref(1)}>Back to first page</Link></EmptyState>
      ) : filters.active > 0 ? (
        <EmptyState icon={ListFilter} title="No items match filters"><button type="button" onClick={filters.clear} className={`hit ${linkClass}`}>Clear filters</button></EmptyState>
      ) : (
        <EmptyState icon={SearchX} title="No matches">Nothing found for “{query.trim()}”. Try a shorter word.</EmptyState>
      )}
    </section>
  )
}
