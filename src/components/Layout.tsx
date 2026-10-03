import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { AuthButton } from './AuthButton'
export function SearchBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const [draft, setDraft] = useState({ query, value: query })
  const text = draft.query === query ? draft.value : query
  useEffect(() => {
    if (location.pathname !== '/search' || text === query) return
    const timer = window.setTimeout(() => navigate(`/search?q=${encodeURIComponent(text)}`, { replace: true }), 250)
    return () => window.clearTimeout(timer)
  }, [text, query, location.pathname, navigate])
  return <form className="w-full sm:max-w-xs" onSubmit={event => { event.preventDefault(); navigate(`/search?q=${encodeURIComponent(text)}`) }}><input aria-label="Search food" type="search" placeholder="Search food" value={text} onChange={event => setDraft({ query, value: event.target.value })} className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm" /></form>
}
export default function Layout() {
  return <div className="flex min-h-screen flex-col"><header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4"><Link to="/" className="mr-auto text-xl font-bold tracking-tight">Terps<span className="text-brand">Dining</span></Link><div className="order-last w-full sm:order-none sm:w-auto sm:flex-1"><SearchBar /></div><nav aria-label="Main navigation" className="flex items-center gap-5"><Link to="/hours" className="text-sm font-medium text-zinc-600 hover:text-brand">Hours</Link><AuthButton /></nav></div></header><main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10"><Outlet /></main><footer className="mt-10 border-t border-zinc-100 py-6"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-zinc-500"><p>Data from UMD Dining. Not affiliated with UMD.</p><nav aria-label="Legal" className="flex gap-4"><Link className="hover:text-brand" to="/privacy">Privacy</Link><Link className="hover:text-brand" to="/terms">Terms</Link></nav></div></footer></div>
}
