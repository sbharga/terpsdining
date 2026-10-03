import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { AuthButton } from './AuthButton'
import { Clock, Search } from 'lucide-react'
import { tones } from '../lib/theme'
export function SearchBar() {
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
  return <form className="w-full sm:max-w-xs" onSubmit={event => { event.preventDefault(); navigate(`/search?q=${encodeURIComponent(text)}`) }}><div className="relative"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input aria-label="Search food" type="search" placeholder="Search dishes, e.g. tacos" value={text} onChange={event => setDraft({ query, value: event.target.value })} className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-base shadow-sm placeholder:text-muted focus:border-brand sm:text-sm" /></div></form>
}
export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-ink">Skip to content</a>
      <header className="border-b border-line bg-canvas/85 backdrop-blur-md sm:sticky sm:top-0 sm:z-30">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="mr-auto font-display text-xl font-extrabold tracking-tight">Terps<span className="text-brand">Dining</span></Link>
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1"><SearchBar /></div>
          <nav aria-label="Main navigation" className="flex items-center gap-2">
            <NavLink to="/hours" className={({ isActive }) => `inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-surface text-ink ring-1 ring-line' : 'text-muted hover:bg-surface hover:text-ink'}`}><Clock size={16} aria-hidden="true" />Hours</NavLink>
            <AuthButton />
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none sm:py-10"><Outlet /></main>
      <footer className="mt-16 border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted">
          <p className="flex items-center gap-2"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${tones.lime.dot}`} />Data from UMD Dining. Not affiliated with UMD.</p>
          <nav aria-label="Footer" className="flex gap-4"><Link className="hover:text-ink" to="/privacy">Privacy</Link><Link className="hover:text-ink" to="/terms">Terms</Link><a className="hover:text-ink" href="https://github.com/sbharga/terpsdining" target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> (opens in a new tab)</span></a></nav>
        </div>
      </footer>
    </div>
  )
}
