import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { AuthButton } from './AuthButton'
import { Clock, Search } from 'lucide-react'
import { tones } from '../lib/theme'
export function SearchBar({ large = false }: { large?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const [draft, setDraft] = useState({ query, value: query })
  const text = draft.query === query ? draft.value : query
  useEffect(() => {
    if (location.pathname !== '/search' || text === query) return
    const timer = window.setTimeout(() => navigate(`/search?q=${encodeURIComponent(text)}`, { replace: true, preventScrollReset: true }), 250)
    return () => window.clearTimeout(timer)
  }, [text, query, location.pathname, navigate])
  return <form className={large ? 'w-full' : 'w-full sm:max-w-xs'} onSubmit={event => { event.preventDefault(); navigate(`/search?q=${encodeURIComponent(text)}`) }}><div className="relative"><Search size={large ? 18 : 16} aria-hidden="true" className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${large ? 'left-4' : 'left-3.5'}`} /><input aria-label="Search food" type="search" placeholder="Search dishes, e.g. tacos" value={text} autoFocus={large && !query} onChange={event => setDraft({ query, value: event.target.value })} className={`w-full rounded-full border border-line bg-surface pr-4 shadow-sm placeholder:text-muted focus:border-brand ${large ? 'py-3.5 pl-11 text-base' : 'py-2 pl-10 text-base sm:text-sm'}`} /></div></form>
}
export default function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-ink">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link to="/" className="mr-auto inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight" aria-label="TerpsDining home"><img src="/favicon.svg" alt="" width="28" height="28" className="h-7 w-7" /><span className="max-[379px]:hidden">Terps<span className="text-brand">Dining</span></span></Link>
          {pathname !== '/search' && <div className="hidden flex-1 sm:block sm:max-w-xs"><SearchBar /></div>}
          <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/search" aria-label="Search" className={({ isActive }) => `grid h-10 w-10 place-items-center rounded-full transition sm:hidden ${isActive ? 'bg-surface text-ink ring-1 ring-line' : 'text-muted hover:bg-surface hover:text-ink'}`}><Search size={20} aria-hidden="true" /></NavLink>
            <NavLink to="/hours" className={({ isActive }) => `inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition sm:px-3 ${isActive ? 'bg-surface text-ink ring-1 ring-line' : 'text-muted hover:bg-surface hover:text-ink'}`}><Clock size={20} aria-hidden="true" className="sm:h-4 sm:w-4" /><span className="sr-only sm:not-sr-only">Hours</span></NavLink>
            <AuthButton />
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 outline-none sm:py-10"><Outlet /></main>
      <footer className="mt-12 border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted">
          <p className="flex items-center gap-2"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${tones.lime.dot}`} />Data from UMD Dining. Not affiliated with UMD.</p>
          <nav aria-label="Footer" className="flex gap-4"><Link className="hover:text-ink" to="/privacy">Privacy</Link><Link className="hover:text-ink" to="/terms">Terms</Link><a className="hover:text-ink" href="https://github.com/sbharga/terpsdining" target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> (opens in a new tab)</span></a></nav>
        </div>
      </footer>
    </div>
  )
}
