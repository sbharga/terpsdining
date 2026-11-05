import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { AuthButton } from './AuthButton'
import { Clock, Search } from 'lucide-react'
import { buttonClass, tones } from '../lib/theme'
function searchHref(base: URLSearchParams | undefined, value: string) {
  const next = new URLSearchParams(base)
  next.set('q', value)
  next.delete('page')
  return `/search?${next}`
}
export function SearchBar({ large = false }: { large?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const [draft, setDraft] = useState({ query, value: query })
  const text = draft.query === query ? draft.value : query
  const base = location.pathname === '/search' ? params : undefined
  useEffect(() => {
    if (location.pathname !== '/search' || text === query) return
    const timer = window.setTimeout(() => navigate(searchHref(base, text), { replace: true, preventScrollReset: true }), 250)
    return () => window.clearTimeout(timer)
  }, [text, query, location.pathname, base, navigate])
  return <form className={large ? 'w-full' : 'w-full sm:max-w-xs'} onSubmit={event => { event.preventDefault(); navigate(searchHref(base, text)) }}><div className="relative"><Search size={large ? 18 : 16} aria-hidden="true" className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${large ? 'left-4' : 'left-3.5'}`} /><input aria-label="Search food" type="search" placeholder="Search dishes, e.g. tacos" value={text} autoFocus={large && !query} onChange={event => setDraft({ query, value: event.target.value })} className={`w-full rounded-full border border-line bg-surface pr-4 text-base placeholder:text-muted focus:border-brand ${large ? 'h-12 pl-11' : 'h-11 pl-10 sm:text-sm'}`} /></div></form>
}
export default function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-ink">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-safe">
          <Link to="/" className="mr-auto inline-flex min-h-11 min-w-11 items-center gap-2 font-display text-xl font-extrabold tracking-tight" aria-label="TerpsDining home"><img src="/favicon.svg" alt="" width="28" height="28" className="h-7 w-7" /><span className="max-[379px]:hidden">Terps<span className="text-brand">Dining</span></span></Link>
          {pathname !== '/search' && <div className="hidden flex-1 sm:block sm:max-w-xs"><SearchBar /></div>}
          <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/search" aria-label="Search" className={({ isActive }) => buttonClass(isActive ? 'secondary' : 'ghost', 'icon') + ' sm:hidden'}><Search size={20} aria-hidden="true" /></NavLink>
            <NavLink to="/hours" className={({ isActive }) => buttonClass(isActive ? 'secondary' : 'ghost', 'md') + ' max-sm:w-11 max-sm:px-0'}><Clock size={20} aria-hidden="true" className="sm:h-4 sm:w-4" /><span className="sr-only sm:not-sr-only">Hours</span></NavLink>
            <AuthButton />
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-safe py-8 outline-none sm:py-12"><Outlet /></main>
      <footer className="mt-16 border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-safe py-4 text-sm text-muted">
          <p className="flex items-center gap-2"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${tones.lime.dot}`} />Data from UMD Dining. Not affiliated with UMD.</p>
          <nav aria-label="Footer" className="flex gap-2"><Link className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-ink" to="/privacy">Privacy</Link><Link className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-ink" to="/terms">Terms</Link><a className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-ink" href="https://status.terpsdining.app" target="_blank" rel="noopener noreferrer">Status<span className="sr-only"> (opens in a new tab)</span></a><a className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-ink" href="https://github.com/sbharga/terpsdining" target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> (opens in a new tab)</span></a></nav>
        </div>
      </footer>
    </div>
  )
}
