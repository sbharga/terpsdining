import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Heart, Star, TriangleAlert, UserRound } from 'lucide-react'
import { useDeleteAccount, useFavoriteIds, useFavorites, useMyRatings, useSession } from '../api/queries'
import { SignInButton } from '../components/AuthButton'
import { EmptyState, ErrorNote, ItemCard, Loading, PageTitle, Panel } from '../components/UI'
import { nameTone, tones } from '../lib/theme'

export default function Account() {
  const { session, error, loading } = useSession()
  const userId = session?.user.id
  const favorites = useFavorites(userId)
  const favoriteIds = useFavoriteIds(userId)
  const ratings = useMyRatings(userId)
  const deleteAccount = useDeleteAccount()
  const [confirming, setConfirming] = useState(false)
  const navigate = useNavigate()
  const title = <PageTitle title="Account" />
  if (error) return <>{title}<ErrorNote retry={() => window.location.reload()} /></>
  if (loading) return <>{title}<Loading /></>
  if (!session) return <>{title}<EmptyState icon={UserRound} title="Sign in to see your account"><SignInButton /></EmptyState></>
  const name = session.user.user_metadata.full_name || session.user.email || '?'
  const visibleRatings = (ratings.data ?? []).filter(row => row.item !== null)
  return <>{title}
    <header className="flex items-center gap-4 rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
      <span aria-hidden="true" className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-bold text-white ${nameTone(name).solid}`}>{name[0]}</span>
      <div className="min-w-0"><h1 className="break-words font-display text-3xl font-extrabold">{name}</h1><p className="break-words text-muted">{session.user.email}</p></div>
    </header>
    <div className="mt-6 space-y-6">
      <Panel id="account-favorites" title="Your favorites" icon={Heart} tone={tones.berry}>
        {favorites.isError ? <ErrorNote retry={favorites.refetch} /> : favorites.isPending ? <Loading inline /> : !favorites.data.length ? <p className="text-muted">No favorites yet. Tap the heart on any dish to save it.</p> : <div className="grid gap-4 sm:grid-cols-2">{favorites.data.map(row => row.item && <ItemCard key={row.item_id} item={row.item} favorite />)}</div>}
      </Panel>
      <Panel id="account-ratings" title="Your ratings" icon={Star} tone={tones.citrus}>
        {ratings.isError ? <ErrorNote retry={ratings.refetch} /> : ratings.isPending ? <Loading inline /> : !visibleRatings.length ? <p className="text-muted">You haven't rated anything yet.</p> : <><p className="mb-4 text-sm text-muted">{visibleRatings.length} {visibleRatings.length === 1 ? 'rating' : 'ratings'}</p><div className="grid gap-4 sm:grid-cols-2">{visibleRatings.map(row => row.item && <ItemCard key={row.item.id} item={row.item} favorite={favoriteIds.has(row.item.id)}><p className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300"><Star size={12} fill="currentColor" aria-hidden="true" />You rated {row.rating}/5</p></ItemCard>)}</div></>}
      </Panel>
      <Panel id="account-delete" title="Delete account" icon={TriangleAlert} tone={tones.tomato}>
        <p className="text-muted">Permanently deletes your account, your ratings, and your favorites. Item averages update to remove your ratings. This can't be undone.</p>
        {confirming ? <div className="mt-4"><p className="font-semibold">Are you sure?</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={deleteAccount.isPending} className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-60" onClick={() => deleteAccount.mutate(undefined, { onSuccess: () => navigate('/', { replace: true }) })}>{deleteAccount.isPending ? 'Deleting…' : 'Yes, delete my account'}</button><button type="button" disabled={deleteAccount.isPending} className="rounded-full border border-line px-4 py-2 font-semibold disabled:opacity-60" onClick={() => { setConfirming(false); deleteAccount.reset() }}>Cancel</button></div></div> : <button type="button" className="mt-4 rounded-full border border-red-600 px-4 py-2 font-semibold text-red-600 dark:text-red-300" onClick={() => setConfirming(true)}>Delete account</button>}
        {deleteAccount.isError && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">Couldn't delete your account. Try again.</p>}
      </Panel>
    </div>
  </>
}
