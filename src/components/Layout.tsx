import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { flushSync } from 'react-dom'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { AuthButton } from './AuthButton'
import { Button } from './UI'
import { Clock, Search, X } from 'lucide-react'
import { buttonClass } from '../lib/theme'
function searchHref(base: URLSearchParams | undefined, value: string) {
  const next = new URLSearchParams(base)
  next.set('q', value)
  next.delete('page')
  return `/search?${next}`
}
export function SearchBar({ large = false, inputRef, onSubmit }: { large?: boolean; inputRef?: Ref<HTMLInputElement>; onSubmit?: () => void }) {
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
  return <form className="w-full" onSubmit={event => { event.preventDefault(); navigate(searchHref(base, text)); onSubmit?.() }}><div className="relative"><Search size={large ? 18 : 16} aria-hidden="true" className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${large ? 'left-4' : 'left-3.5'}`} /><input ref={inputRef} aria-label="Search food" type="search" placeholder="Search dishes, e.g. tacos" value={text} autoFocus={large && !query} onChange={event => setDraft({ query, value: event.target.value })} className={`w-full rounded-full border border-line bg-surface pr-4 text-base placeholder:text-muted focus-visible:-outline-offset-1! ${large ? 'h-12 pl-11' : 'h-11 pl-10 sm:text-sm'}`} /></div></form>
}
export function IslandDock({ island, children }: { island: ReactNode; children: ReactNode }) {
  const setAccessory = useContext(IslandContext)
  const barRef = useRef<HTMLDivElement>(null)
  const [docked, setDocked] = useState(false)
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const observer = new IntersectionObserver(([entry]) => setDocked(!entry.isIntersecting && entry.boundingClientRect.top < islandBottom), { rootMargin: `-${islandBottom}px 0px 0px 0px` })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!docked) return
    setAccessory(island)
    return () => setAccessory(null)
  }, [docked, island, setAccessory])
  return <div ref={barRef} inert={docked}>{children}</div>
}
const islandBottom = 64 // header pt-2 + h-14
const IslandContext = createContext<(node: ReactNode | null) => void>(() => {})
function NavIsland({ accessory }: { accessory: ReactNode | null }) {
  const { pathname } = useLocation()
  const [searchPath, setSearchPath] = useState<string | null>(null)
  const [morphed, setMorphed] = useState(false)
  if (searchPath !== null && searchPath !== pathname) setSearchPath(null)
  const expanded = searchPath === pathname
  const docked = accessory !== null
  const islandRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const lastWidth = useRef<number | null>(null)
  function open() {
    flushSync(() => { setSearchPath(pathname); setMorphed(true) })
    inputRef.current?.focus()
  }
  function close() {
    flushSync(() => setSearchPath(null))
  }
  useEffect(() => {
    const island = islandRef.current
    if (!island) return
    const observer = new ResizeObserver(([entry]) => { lastWidth.current = entry.borderBoxSize[0].inlineSize })
    observer.observe(island)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    const island = islandRef.current
    const from = lastWidth.current
    if (!island || from === null) return
    island.style.transition = 'none'
    island.style.width = ''
    const to = island.getBoundingClientRect().width
    if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { island.style.transition = ''; return }
    island.style.width = `${from}px`
    void island.offsetWidth
    island.style.transition = ''
    island.style.width = `${to}px`
    const done = (event: TransitionEvent) => { if (event.target === island && event.propertyName === 'width') island.style.width = '' }
    island.addEventListener('transitionend', done)
    return () => island.removeEventListener('transitionend', done)
  }, [expanded, docked])
  useEffect(() => {
    if (!expanded) return
    function outside(event: PointerEvent) { if (event.target instanceof Node && !islandRef.current?.contains(event.target)) close() }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { close(); triggerRef.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [expanded])
  const enter = morphed ? 'motion-safe:animate-island-in' : ''
  return (
    <header className="pointer-events-none sticky top-0 z-30 px-safe pt-2">
      <div ref={islandRef} className={`pointer-events-auto mx-auto flex h-14 max-w-full items-center rounded-full bg-surface/80 px-1.5 shadow-lg shadow-black/5 ring-1 ring-line backdrop-blur-md motion-safe:transition-[width] motion-safe:duration-500 ${expanded ? 'w-[36rem] motion-safe:ease-[cubic-bezier(0.34,1.36,0.64,1)]' : docked ? 'w-full motion-safe:ease-[cubic-bezier(0.34,1.36,0.64,1)] sm:w-fit' : 'w-fit motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]'}`}>
        {expanded
          ? <div key="search" className={`flex min-w-0 flex-1 items-center gap-1 ${enter}`}>
              <div className="min-w-0 flex-1"><SearchBar inputRef={inputRef} onSubmit={close} /></div>
              <Button variant="ghost" size="icon" aria-label="Close search" onClick={() => { close(); triggerRef.current?.focus() }}><X size={20} aria-hidden="true" /></Button>
            </div>
          : <div key="nav" className={`flex min-w-0 flex-1 items-center justify-between gap-2 ${enter}`}>
              <Link to="/" className={`${docked ? 'max-sm:hidden ' : ''}inline-flex h-11 w-11 items-center justify-center text-brand motion-safe:transition-transform motion-safe:hover:scale-110`} aria-label="TerpsDining home"><svg viewBox="10 11 44 42" width="32" height="30" aria-hidden="true" className="h-[30px] w-8"><path fill="currentColor" d="M13 31h38a19 19 0 0 1-38 0z" /><path d="M24 24c-2.5-3 2.5-5 0-9M32 24c-2.5-3 2.5-5 0-9M40 24c-2.5-3 2.5-5 0-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" /></svg></Link>
              {docked && <div className="flex min-w-0 flex-1 motion-safe:animate-island-in sm:flex-none">{accessory}</div>}
              <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
                {pathname !== '/search' && <Button ref={triggerRef} variant="ghost" onClick={open} className="max-sm:w-11 max-sm:px-0"><Search size={20} aria-hidden="true" className="sm:h-4 sm:w-4" /><span className="sr-only sm:not-sr-only">Search</span></Button>}
                <NavLink to="/hours" className={({ isActive }) => buttonClass(isActive ? 'secondary' : 'ghost', 'md') + ' max-sm:w-11 max-sm:px-0' + (docked ? ' max-sm:hidden' : '')}><Clock size={20} aria-hidden="true" className="sm:h-4 sm:w-4" /><span className="sr-only sm:not-sr-only">Hours</span></NavLink>
                <AuthButton />
              </nav>
            </div>}
      </div>
    </header>
  )
}
export default function Layout() {
  const [accessory, setAccessory] = useState<ReactNode | null>(null)
  return (
    <IslandContext value={setAccessory}>
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-ink">Skip to content</a>
      <NavIsland accessory={accessory} />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-safe py-8 outline-none sm:py-12"><Outlet /></main>
      <footer className="mt-16 border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-safe py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link to="/" className="inline-flex min-h-11 items-center gap-2.5 font-display text-xl font-extrabold tracking-tight"><img src="/favicon.svg" alt="" width="32" height="32" className="h-8 w-8" />TerpsDining</Link>
            <p className="mt-1 text-sm text-muted">Menus, hours, nutrition and ratings for UMD dining halls.</p>
            <p className="mt-3 text-xs text-muted">Not affiliated with University of Maryland.</p>
          </div>
          <nav aria-label="Footer" className="-mx-2 flex flex-wrap text-sm text-muted"><Link className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 hover:text-ink" to="/privacy">Privacy</Link><Link className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 hover:text-ink" to="/terms">Terms</Link><a className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 hover:text-ink" href="https://status.terpsdining.app" target="_blank" rel="noopener noreferrer">Status<span className="sr-only"> (opens in a new tab)</span></a><a className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 hover:text-ink" href="https://github.com/sbharga/terpsdining" target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> (opens in a new tab)</span></a></nav>
        </div>
      </footer>
    </div>
    </IslandContext>
  )
}
