import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useSession } from '../api/queries'
import { auth } from '../lib/supabase'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { nameTone } from '../lib/theme'
export function SignInButton({ children = 'Sign in' }: { children?: ReactNode }) {
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)
  async function signIn() {
    setPending(true)
    const { error } = await auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } })
    setError(!!error)
    setPending(false)
  }
  return <div><button disabled={pending} onClick={() => void signIn()} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:brightness-110 disabled:opacity-60">{children}</button>{error && <p role="alert" className="mt-2 text-xs text-brand">Couldn't sign in. Try again.</p>}</div>
}
export function AuthButton() {
  const { session, error: sessionError } = useSession()
  const [error, setError] = useState(false)
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [openPath, setOpenPath] = useState(pathname)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstItemRef = useRef<HTMLAnchorElement>(null)
  const visible = open && openPath === pathname && !!session
  useEffect(() => {
    if (!visible) return
    firstItemRef.current?.focus()
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [visible])
  if (sessionError) return <button onClick={() => window.location.reload()} className="rounded-full px-3 py-2 text-sm font-semibold text-brand">Couldn't load. Retry</button>
  if (!session) return <SignInButton />
  const name = session.user.user_metadata.full_name || session.user.email || '?'
  return <div ref={rootRef} className="relative">
    <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={visible} aria-label="Account menu" className="flex items-center gap-2 rounded-full p-1 text-muted hover:bg-surface hover:text-ink" onClick={() => { setOpen(!visible); setOpenPath(pathname); setError(false) }}>
      <span aria-hidden="true" className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white ${nameTone(name).solid}`}>{name[0]}</span><ChevronDown size={14} aria-hidden="true" className={`transition ${visible ? 'rotate-180' : ''}`} />
    </button>
    {visible && <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl bg-surface p-1 shadow-lg ring-1 ring-line">
      <div className="px-3 py-2"><p className="truncate font-semibold">{name}</p><p className="truncate text-xs text-muted">{session.user.email}</p></div>
      <Link ref={firstItemRef} role="menuitem" to="/account" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2" onClick={() => setOpen(false)}><UserRound size={16} aria-hidden="true" />My account</Link>
      <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2" onClick={async () => { const { error } = await auth.signOut(); setError(!!error); if (!error) setOpen(false) }}><LogOut size={16} aria-hidden="true" />Sign out</button>
      {error && <p role="alert" className="px-3 py-1 text-xs text-brand">Couldn't sign out. Try again.</p>}
    </div>}
  </div>
}
