import { Link, useParams } from 'react-router'
import { useItem, useItemHistory, useMyRating, useRateItem, useSession } from '../api/queries'
import type { ItemHistoryRow } from '../api/queries'
import { SignInButton } from '../components/AuthButton'
import { Badges, ErrorNote, Loading, NotFound, PageTitle, StarRating } from '../components/UI'
import type { Json } from '../lib/database.types'
import { formatDay, relativeDay, todayET } from '../lib/dates'
import { imageUrl } from '../lib/supabase'

const meals = ['Breakfast', 'Lunch', 'Dinner'] as const

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

function nutritionDetails(value: Json) {
  const nutrition = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
  if (!nutrition) return null
  const nutrients = Array.isArray(nutrition.nutrients) ? nutrition.nutrients.flatMap(value => {
    const nutrient = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
    return nutrient && typeof nutrient.name === 'string' && typeof nutrient.amount === 'string'
      ? [{ name: nutrient.name, amount: nutrient.amount, dv: typeof nutrient.dv === 'string' ? nutrient.dv : null }]
      : []
  }) : []
  return {
    servings: typeof nutrition.servings === 'string' ? nutrition.servings : null,
    servingSize: typeof nutrition.serving_size === 'string' ? nutrition.serving_size : null,
    calories: typeof nutrition.calories === 'number' ? nutrition.calories : null,
    nutrients,
  }
}

export default function Item() {
  const { id = '' } = useParams()
  const itemQuery = useItem(id)
  const historyQuery = useItemHistory(id)
  const { session, error: sessionError } = useSession()
  const myRating = useMyRating(id, session?.user.id)
  const rateItem = useRateItem(id)
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

  return (
    <article>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {image ? (
          <img src={image} alt="" width={160} height={160} loading="lazy" decoding="async" className="h-40 w-40 rounded-xl object-cover" />
        ) : (
          <div aria-hidden="true" className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-5xl text-zinc-400">{item.name.charAt(0)}</div>
        )}
        <div>
          <PageTitle title={item.name} />
          <h1 className="mb-3 text-3xl font-semibold tracking-tight">{item.name}</h1>
          <Badges allergens={item.allergens} dietary={item.dietary} />
          <p className="mt-3 text-sm text-zinc-600">
            {item.rating_avg === null || item.rating_count === 0
              ? 'No ratings'
              : `★ ${item.rating_avg.toFixed(1)} · ${item.rating_count} ${item.rating_count === 1 ? 'rating' : 'ratings'}`}
          </p>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="item-today">
        <h2 id="item-today" className="mb-3 text-lg font-semibold">Today</h2>
        {historyQuery.isError ? <ErrorNote retry={historyQuery.refetch} /> : historyQuery.isPending ? <Loading /> : todayHalls.length > 0 ? (
          <ul className="space-y-2">
            {todayHalls.map(hall => (
              <li key={hall.slug}>
                <Link to={`/halls/${hall.slug}?meal=${encodeURIComponent(hall.meals[0])}`} className="rounded text-brand underline decoration-zinc-300 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                  {hall.name} — {hall.meals.join(', ')}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-600">
            {item.last_seen
              ? `Not served today · Last served ${relativeDay(item.last_seen, today)}${lastHalls.length ? ` at ${lastHalls.map(hall => hall.name).join(', ')}` : ''}`
              : 'Not served yet'}
          </p>
        )}
      </section>

      <section className="mt-10" aria-labelledby="item-rating">
        <h2 id="item-rating" className="mb-3 text-lg font-semibold">Your rating</h2>
        {sessionError ? <ErrorNote retry={() => window.location.reload()} /> : session ? (
          <>
            {myRating.isError && <ErrorNote retry={myRating.refetch} />}
            {myRating.isPending ? <Loading /> : (
              <StarRating value={myRating.data ?? null} onChange={rating => rateItem.mutate(rating)} disabled={myRating.isError || rateItem.isPending} />
            )}
            {rateItem.isPending && <p role="status" className="mt-2 text-sm text-zinc-500">Saving…</p>}
            {rateItem.isError && (
              <p role="alert" className="mt-2 text-sm text-zinc-600">
                Couldn't save.{' '}
                <button type="button" onClick={() => { if (rateItem.variables !== undefined) rateItem.mutate(rateItem.variables) }} className="rounded text-brand underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">Retry</button>
              </p>
            )}
          </>
        ) : <SignInButton>Sign in to rate</SignInButton>}
      </section>

      <section className="mt-10" aria-labelledby="item-nutrition">
        <h2 id="item-nutrition" className="mb-3 text-lg font-semibold">Nutrition</h2>
        {nutrition ? (
          <>
            <p className="text-zinc-600">
              {[nutrition.servingSize ? `Serving ${nutrition.servingSize}` : null, nutrition.calories !== null ? `${nutrition.calories} cal` : null].filter(Boolean).join(' · ') || 'Serving not available.'}
            </p>
            {nutrition.servings && <p className="mt-1 text-sm text-zinc-500">{nutrition.servings}</p>}
            <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {nutrition.nutrients.map((nutrient, index) => (
                <div key={`${nutrient.name}-${index}`} className="flex justify-between gap-4 border-b border-zinc-100 py-2 text-sm">
                  <dt>{nutrient.name}</dt>
                  <dd className="shrink-0 text-zinc-600">{nutrient.amount}{nutrient.dv ? ` · ${nutrient.dv}` : ''}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : <p className="text-zinc-600">Nutrition not available.</p>}
      </section>

      <section className="mt-10">
        <details className="rounded-xl border border-zinc-200 p-4">
          <summary className="cursor-pointer rounded font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">Ingredients</summary>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.ingredients || 'Ingredients not available.'}</p>
          {item.label_allergens && <p className="mt-3 text-sm text-zinc-600">Allergens: {item.label_allergens}</p>}
        </details>
        {item.label_url && <a href={item.label_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded text-sm text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">Official label ↗</a>}
      </section>

      <section className="mt-10" aria-labelledby="item-history">
        <h2 id="item-history" className="mb-3 text-lg font-semibold">History</h2>
        {historyQuery.isError ? <ErrorNote retry={historyQuery.refetch} /> : historyQuery.isPending ? <Loading /> : (
          <>
            <p className="mb-4 text-sm text-zinc-500">
              {`Served ${dates.length} ${dates.length === 1 ? 'day' : 'days'}${item.first_seen ? ` since ${formatDay(item.first_seen)}` : ''}`}
            </p>
            {dates.length ? (
              <ul className="divide-y divide-zinc-100">
                {dates.slice(0, 30).map(date => (
                  <li key={date} className="py-3 text-sm">
                    <time dateTime={date} className="font-medium">{formatDay(date)}</time>
                    {' — '}
                    <span className="text-zinc-600">{groupHalls(byDate.get(date) ?? []).map(hall => `${hall.name} (${hall.meals.join(', ')})`).join(', ')}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-zinc-600">Not served yet</p>}
          </>
        )}
      </section>
    </article>
  )
}
