import { useState, type ReactNode } from 'react'
import { useSession } from '../api/queries'
import { supabase } from '../lib/supabase'
import { LogOut } from 'lucide-react'
import { nameTone } from '../lib/theme'
export function SignInButton({ children = 'Sign in' }: { children?: ReactNode }) {
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)
  async function signIn() {
    setPending(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } })
    setError(!!error)
    setPending(false)
  }
  return <div><button disabled={pending} onClick={() => void signIn()} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:brightness-110 disabled:opacity-60">{children}</button>{error && <p role="alert" className="mt-2 text-xs text-brand">Couldn't sign in. Try again.</p>}</div>
}
export function AuthButton() {
  const { session, error: sessionError } = useSession()
  const [error, setError] = useState(false)
  if (sessionError) return <button onClick={() => window.location.reload()} className="rounded-full px-3 py-2 text-sm font-semibold text-brand">Couldn't load. Retry</button>
  if (!session) return <SignInButton />
  const name = session.user.user_metadata.full_name || session.user.email || '?'
  return <div className="flex items-center gap-2"><span aria-hidden="true" className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white ${nameTone(name).solid}`}>{name[0]}</span><button type="button" aria-label="Sign out" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-ink" onClick={async () => { const { error } = await supabase.auth.signOut(); setError(!!error) }}><LogOut size={16} aria-hidden="true" /><span className="hidden sm:inline">Sign out</span></button>{error && <span role="alert" className="text-xs text-brand">Try again.</span>}</div>
}
