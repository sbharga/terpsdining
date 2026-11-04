import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Heart, Star, TriangleAlert, UserRound } from 'lucide-react'
import { useDeleteAccount, useFavoriteIds, useFavorites, useMyRatings, useSession } from '../api/queries'
import { SignInButton } from '../components/AuthButton'
import { Avatar, Button, EmptyState, ErrorNote, ItemList, ItemRow, Loading, PageTitle, Panel } from '../components/UI'
import { cardClass, titleClass, tones } from '../lib/theme'

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
    <header className={`flex items-center gap-4 ${cardClass} p-5 sm:p-6`}>
      <Avatar name={name} size="lg" />
      <div className="min-w-0"><h1 className={`break-words ${titleClass}`}>{name}</h1><p className="break-words text-muted">{session.user.email}</p></div>
    </header>
    <div className="mt-6 space-y-6">
      <Panel id="account-favorites" title="Your favorites" icon={Heart} tone={tones.berry}>
        {favorites.isError ? <ErrorNote retry={favorites.refetch} /> : favorites.isPending ? <Loading inline /> : !favorites.data.length ? <p className="text-muted">No favorites yet. Tap the heart on any dish to save it.</p> : <ItemList>{favorites.data.map(row => row.item && <ItemRow key={row.item_id} item={row.item} favorite />)}</ItemList>}
      </Panel>
      <Panel id="account-ratings" title="Your ratings" icon={Star} tone={tones.citrus}>
        {ratings.isError ? <ErrorNote retry={ratings.refetch} /> : ratings.isPending ? <Loading inline /> : !visibleRatings.length ? <p className="text-muted">You haven't rated anything yet.</p> : <><p className="mb-4 text-sm text-muted">{visibleRatings.length} {visibleRatings.length === 1 ? 'rating' : 'ratings'}</p><ItemList>{visibleRatings.map(row => row.item && <ItemRow key={row.item.id} item={row.item} favorite={favoriteIds.has(row.item.id)}><p className="mt-1 flex items-center gap-1 text-sm font-medium text-ink"><Star size={13} fill="currentColor" aria-hidden="true" className="text-star" />You rated {row.rating}/5</p></ItemRow>)}</ItemList></>}
      </Panel>
      <Panel id="account-delete" title="Delete account" icon={TriangleAlert} tone={tones.tomato}>
        <p className="text-muted">Permanently deletes your account, your ratings, and your favorites. Item averages update to remove your ratings. This can't be undone.</p>
        {confirming ? <div className="mt-4"><p className="font-semibold">Are you sure?</p><div className="mt-3 flex flex-wrap gap-3"><Button variant="danger" disabled={deleteAccount.isPending} onClick={() => deleteAccount.mutate(undefined, { onSuccess: () => navigate('/', { replace: true }) })}>{deleteAccount.isPending ? 'Deleting…' : 'Yes, delete my account'}</Button><Button disabled={deleteAccount.isPending} onClick={() => { setConfirming(false); deleteAccount.reset() }}>Cancel</Button></div></div> : <Button variant="danger" className="mt-4" onClick={() => setConfirming(true)}>Delete account</Button>}
        {deleteAccount.isError && <p role="alert" className="mt-2 text-sm text-danger">Couldn't delete your account. Try again.</p>}
      </Panel>
    </div>
  </>
}
