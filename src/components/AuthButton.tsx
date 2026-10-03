import { useState, type ReactNode } from 'react'
import { useSession } from '../api/queries'
import { supabase } from '../lib/supabase'
export function SignInButton({ children = 'Sign in' }: { children?: ReactNode }) {
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)
  async function signIn() {
    setPending(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } })
    setError(!!error)
    setPending(false)
  }
  return <div><button disabled={pending} onClick={() => void signIn()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">{children}</button>{error && <p role="alert" className="mt-2 text-xs text-brand">Couldn't sign in. Try again.</p>}</div>
}
export function AuthButton() {
  const { session, error: sessionError } = useSession()
  const [error, setError] = useState(false)
  if (sessionError) return <button onClick={() => window.location.reload()} className="text-sm text-brand">Couldn't load. Retry</button>
  if (!session) return <SignInButton />
  return <div className="flex items-center gap-2"><span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold">{(session.user.user_metadata.full_name || session.user.email || '?')[0]}</span><button className="text-sm text-zinc-600" onClick={async () => { const { error } = await supabase.auth.signOut(); setError(!!error) }}>Sign out</button>{error && <span role="alert" className="text-xs text-brand">Try again.</span>}</div>
}
