import { CalendarDays, ExternalLink, Flame, Heart, LoaderCircle, Star, Wheat } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useFavorites, useItem, useItemHistory, useMyRating, useRateItem, useSession, useToggleFavorite } from '../api/queries'
import type { ItemHistoryRow } from '../api/queries'
import { SignInButton } from '../components/AuthButton'
import { Badges, Chip, Disclosure, ErrorNote, FoodSwatch, Loading, NotFound, PageTitle, Panel, RatingPill, StarRating, StatGrid } from '../components/UI'
import { nutritionDetails } from '../lib/nutrition'
import { formatDay, relativeDay, todayET } from '../lib/dates'
import { imageUrl } from '../lib/supabase'
import { cardClass, hallTone, linkClass, overlineClass, titleClass, tones } from '../lib/theme'
import { meals } from '../lib/hours'

type HallMeals = { slug: string; name: string; meals: string[] }

function groupHalls(rows: ItemHistoryRow[]): HallMeals[] {
  const halls = new Map<string, { name: string; meals: Set<string> }>()
  for (const row of rows) {
    if (!row.hall) continue
    const hall = halls.get(row.hall.slug) ?? { name: row.hall.name, meals: new Set<string>() }
    hall.meals.add(row.meal)
    halls.set(row.hall.slug, hall)
  }
  return Array.from(halls, ([slug, hall]) => ({
    slug,
    name: hall.name,
    meals: meals.filter(meal => hall.meals.has(meal)),
  })).sort((a, b) => a.name.localeCompare(b.name))
}

function HistoryList({ dates, byDate }: { dates: string[]; byDate: Map<string, ItemHistoryRow[]> }) {
  return (
    <ol className="space-y-4 border-l-2 border-line pl-5">
      {dates.map(date => {
        const halls = groupHalls(byDate.get(date) ?? [])
        return (
          <li key={date} className="relative">
            <span aria-hidden="true" className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-surface ${hallTone(halls[0]?.slug ?? '').dot}`} />
            <time dateTime={date} className="text-sm font-semibold">{formatDay(date)}</time>
            <p className="text-sm text-muted">{halls.map(hall => `${hall.name} (${hall.meals.join(', ')})`).join(', ')}</p>
          </li>
        )
      })}
    </ol>
  )
}

export default function Item() {
  const { id = '' } = useParams()
  const itemQuery = useItem(id)
  const historyQuery = useItemHistory(id)
  const { session, error: sessionError } = useSession()
  const myRating = useMyRating(id, session?.user.id)
  const rateItem = useRateItem(id, session?.user.id)
  const favorites = useFavorites(session?.user.id)
  const isFavorite = favorites.data?.some(row => row.item_id === id) ?? false
  const toggleFavorite = useToggleFavorite(id, session?.user.id)
  const today = todayET()

  if (itemQuery.isError) return <><PageTitle title="Item" /><ErrorNote retry={itemQuery.refetch} /></>
  if (itemQuery.isPending) return <><PageTitle title="Item" /><Loading /></>
  const item = itemQuery.data
  if (!item) return <NotFound />

  const image = imageUrl(item.image_path)
  const nutrition = item.nutrition === null ? null : nutritionDetails(item.nutrition)
  const history = historyQuery.data ?? []
  const todayHalls = groupHalls(history.filter(row => row.date === today))
  const lastHalls = groupHalls(history.filter(row => row.date === item.last_seen))
  const byDate = new Map<string, ItemHistoryRow[]>()
  for (const row of history) {
    const rows = byDate.get(row.date) ?? []
    rows.push(row)
    byDate.set(row.date, rows)
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a))

  const stats = nutrition ? ([
    ['Calories', nutrition.calories === null ? null : String(nutrition.calories), tones.tomato],
    ['Protein', nutrition.nutrients.find(nutrient => nutrient.name === 'Protein')?.amount ?? null, tones.berry],
    ['Carbs', nutrition.nutrients.find(nutrient => nutrient.name === 'Total Carbohydrate')?.amount ?? null, tones.sky],
    ['Fat', nutrition.nutrients.find(nutrient => nutrient.name === 'Total Fat')?.amount ?? null, tones.citrus],
  ] as const).flatMap(([label, value, tone]) => value === null ? [] : [[label, value, tone] as const]) : []

  return (
    <article>
      <PageTitle title={item.name} />
      <header className={`grid gap-6 ${cardClass} p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6`}>
        {image ? (
          <img src={image} alt="" width={176} height={176} loading="eager" fetchPriority="high" decoding="async" className="h-52 w-full rounded-2xl object-cover sm:h-44 sm:w-44" />
        ) : (
          <FoodSwatch name={item.name} className="h-52 w-full rounded-2xl text-7xl sm:h-44 sm:w-44" />
        )}
        <div>
          <h1 className={`mb-3 ${titleClass}`}>{item.name}</h1>
          <Badges allergens={item.allergens} dietary={item.dietary} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {item.rating_count > 0 && item.rating_avg !== null
              ? <RatingPill avg={item.rating_avg} count={item.rating_count} />
              : <p className="text-sm text-muted">No ratings yet</p>}
            {session && <Chip tone={tones.berry} pressed={isFavorite} disabled={favorites.isPending || favorites.isError || toggleFavorite.isPending} onClick={() => toggleFavorite.mutate(!isFavorite)}><Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />{isFavorite ? 'Favorited' : 'Add to favorites'}</Chip>}
          </div>
          {session && (toggleFavorite.isError || favorites.isError) && <p role="alert" className="mt-2 text-sm text-danger">Couldn't update favorite.</p>}
          <div className="mt-4">
            <p className={overlineClass}>Today</p>
            <div className="mt-1.5">
              {historyQuery.isError ? <ErrorNote retry={historyQuery.refetch} /> : historyQuery.isPending ? <Loading inline /> : todayHalls.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {todayHalls.map(hall => (
                    <li key={hall.slug}>
                      <Link to={`/halls/${hall.slug}?meal=${encodeURIComponent(hall.meals[0])}`} className={`hit inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition hover:brightness-95 ${hallTone(hall.slug).soft}`}>
                        {hall.name} · {hall.meals.join(', ')}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  {item.last_seen
                    ? `Not served today · Last served ${relativeDay(item.last_seen, today)}${lastHalls.length ? ` at ${lastHalls.map(hall => hall.name).join(', ')}` : ''}`
                    : 'Not served yet'}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <aside className="space-y-6 lg:order-last">
          <Panel id="item-rating" title="Your rating" icon={Star} tone={tones.citrus}>
            {sessionError ? <ErrorNote retry={() => window.location.reload()} /> : session ? (
              <>
                {myRating.isError && <ErrorNote retry={myRating.refetch} />}
                {myRating.isPending ? <Loading inline /> : (
                  <StarRating value={myRating.data ?? null} onChange={rating => rateItem.mutate(rating)} disabled={myRating.isError || rateItem.isPending} />
                )}
                {rateItem.isPending && <p role="status" className="mt-2 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={14} className="motion-safe:animate-spin" aria-hidden="true" />Saving…</p>}
                {rateItem.isError && (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    Couldn't save.{' '}
                    <button type="button" onClick={() => { if (rateItem.variables !== undefined) rateItem.mutate(rateItem.variables) }} className={linkClass}>Retry</button>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">Sign in with Google to rate this dish.</p>
                <SignInButton>Sign in to rate</SignInButton>
              </>
            )}
          </Panel>
        </aside>

        <div className="space-y-6 lg:col-span-2">
          <Panel id="item-nutrition" title="Nutrition" icon={Flame} tone={tones.lime}>
            {nutrition ? (
              <>
                {stats.length > 0 && <StatGrid stats={stats} className="mb-5" />}
                <p className="text-muted">
                  {[nutrition.servingSize ? `Serving ${nutrition.servingSize}` : null, nutrition.calories !== null ? `${nutrition.calories} cal` : null].filter(Boolean).join(' · ') || 'Serving not available.'}
                </p>
                {nutrition.servings && <p className="mt-1 text-sm text-muted">{nutrition.servings}</p>}
                {nutrition.nutrients.length > 0 && (
                  <Disclosure className="mt-4" summary={`All nutrition facts (${nutrition.nutrients.length})`}>
                    <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
                      {nutrition.nutrients.map((nutrient, index) => (
                        <div key={`${nutrient.name}-${index}`} className="flex justify-between gap-4 border-b border-line py-2 text-sm">
                          <dt>{nutrient.name}</dt>
                          <dd className="shrink-0 text-muted">{nutrient.amount}{nutrient.dv ? ` · ${nutrient.dv}` : ''}</dd>
                        </div>
                      ))}
                    </dl>
                  </Disclosure>
                )}
              </>
            ) : <p className="text-muted">Nutrition not available.</p>}
          </Panel>

          <Panel id="item-ingredients" title="Ingredients" icon={Wheat} tone={tones.citrus}>
            {item.ingredients ? (
              <Disclosure summary="Show ingredients">
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.ingredients}</p>
              </Disclosure>
            ) : <p className="text-muted">Ingredients not available.</p>}
            {item.label_allergens && <p className="mt-3 text-sm text-muted">Allergens: {item.label_allergens}</p>}
            {item.label_url && <a href={item.label_url} target="_blank" rel="noopener noreferrer" className={`hit mt-4 inline-flex items-center gap-1 text-sm ${linkClass}`}>Official label <ExternalLink size={14} aria-hidden="true" /></a>}
          </Panel>

          <Panel id="item-history" title="History" icon={CalendarDays} tone={tones.grape}>
            {historyQuery.isError ? <ErrorNote retry={historyQuery.refetch} /> : historyQuery.isPending ? <Loading inline /> : (
              <>
                <p className="mb-4 text-sm text-muted">
                  {`Served ${dates.length} ${dates.length === 1 ? 'day' : 'days'} in the last year${item.first_seen ? ` · First served ${formatDay(item.first_seen)}` : ''}`}
                </p>
                {dates.length ? (
                  <>
                    <HistoryList dates={dates.slice(0, 7)} byDate={byDate} />
                    {dates.length > 7 && (
                      <Disclosure className="mt-4" summary={`Show ${Math.min(dates.length, 30) - 7} more`}>
                        <div className="mt-4"><HistoryList dates={dates.slice(7, 30)} byDate={byDate} /></div>
                      </Disclosure>
                    )}
                  </>
                ) : <p className="text-muted">Not served yet</p>}
              </>
            )}
          </Panel>
        </div>
      </div>
    </article>
  )
}
