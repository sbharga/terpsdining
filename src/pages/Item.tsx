import { useState } from 'react'
import { CalendarDays, ExternalLink, Flame, Heart, LoaderCircle, Star, Wheat } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { useFavorites, useItem, useItemHistory, useMyRating, useRateItem, useSession, useToggleFavorite } from '../api/queries'
import { SignInButton } from '../components/AuthButton'
import { Badges, Chip, Disclosure, ErrorNote, FoodSwatch, Loading, NotFound, PageTitle, Panel, RatingPill, StarRating, StatGrid } from '../components/UI'
import { nutritionDetails } from '../lib/nutrition'
import { markAllergens } from '../lib/allergens'
import { formatMonthDay, relativeDay, todayET } from '../lib/dates'
import { imageUrl } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { cardClass, hallTone, linkClass, overlineClass, titleClass, tones } from '../lib/theme'
import { calendarDates, groupHalls, historyDays, historyRuns, runDetail, runLabel, topHall, type HistoryDay, type HistoryRun } from '../lib/history'
import { itemDescription } from '../lib/seo'

type ItemRow = Database['public']['Tables']['items']['Row']

function sameTags(a: string[], b: string[]) { return a.length === b.length && a.every(tag => b.includes(tag)) }

function HistoryCalendar({ days, today }: { days: HistoryDay[]; today: string }) {
  const served = new Map(days.map(day => [day.date, day.halls]))
  const dates = calendarDates(today, 6)
  const past = dates.filter(date => date <= today)
  const count = past.filter(date => served.has(date)).length
  const legend = Array.from(new Map(dates.flatMap(date => served.get(date) ?? []).map(hall => [hall.slug, hall] as const)).values()).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="max-w-sm">
      <p className="text-sm text-muted tabular-nums">{formatMonthDay(dates[0])} – {formatMonthDay(dates[dates.length - 1])}</p>
      <div aria-hidden="true" className="mt-2 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((letter, index) => <span key={index}>{letter}</span>)}
      </div>
      <div role="img" aria-label={`Served ${count} of the last ${past.length} days`} className="mt-1.5 grid grid-cols-7 gap-1.5">
        {dates.map(date => {
          const halls = served.get(date)
          const state = date === today ? 'font-extrabold text-brand' : halls ? 'font-semibold text-ink' : date < today ? 'text-muted' : 'text-muted/40'
          return (
            <div key={date} className={`relative mx-auto grid h-9 w-9 place-items-center rounded-full text-xs tabular-nums ${state}`}>
              {Number(date.slice(8))}
              {halls && <span className="absolute bottom-1 flex gap-0.5">{halls.map(hall => <span key={hall.slug} className={`h-1.5 w-1.5 rounded-full ${hallTone(hall.slug).dot}`} />)}</span>}
            </div>
          )
        })}
      </div>
      {legend.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {legend.map(hall => (
            <li key={hall.slug} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${hallTone(hall.slug).dot}`} />
              {hall.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function HistoryRunList({ runs, today }: { runs: HistoryRun[]; today: string }) {
  return (
    <ol className="divide-y divide-line">
      {runs.map(run => (
        <li key={run.to} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold tabular-nums">{runLabel(run)}</span>
            <span className="text-sm text-muted">{runDetail(run, today)}</span>
          </p>
          <ul className="flex flex-col gap-0.5 text-sm text-muted sm:items-end">
            {run.halls.map(hall => (
              <li key={hall.slug} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${hallTone(hall.slug).dot}`} />
                {hall.name} · {hall.meals.join(', ')}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

function RecipeNutrition({ recipe }: { recipe: ItemRow }) {
  const nutrition = recipe.nutrition === null ? null : nutritionDetails(recipe.nutrition)
  if (!nutrition) return <p className="text-muted">Nutrition not available.</p>
  const stats = ([
    ['Calories', nutrition.calories === null ? null : String(nutrition.calories), tones.tomato],
    ['Protein', nutrition.nutrients.find(nutrient => nutrient.name === 'Protein')?.amount ?? null, tones.berry],
    ['Carbs', nutrition.nutrients.find(nutrient => nutrient.name === 'Total Carbohydrate')?.amount ?? null, tones.sky],
    ['Fat', nutrition.nutrients.find(nutrient => nutrient.name === 'Total Fat')?.amount ?? null, tones.citrus],
  ] as const).flatMap(([label, value, tone]) => value === null ? [] : [[label, value, tone] as const])
  return (
    <>
      {stats.length > 0 && <StatGrid stats={stats} className="mb-5" />}
      {nutrition.servingSize && <p className="text-sm text-muted">Serving size {nutrition.servingSize}</p>}
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
  )
}

function RecipeIngredients({ recipe }: { recipe: ItemRow }) {
  return (
    <>
      {recipe.ingredients ? (
        <Disclosure summary="Show ingredients">
          <p className="mt-2 text-sm leading-relaxed text-muted">{markAllergens(recipe.ingredients).map((part, index) => part.allergen ? <strong key={index} className="font-semibold text-ink">{part.text}</strong> : part.text)}</p>
        </Disclosure>
      ) : <p className="text-muted">Ingredients not available.</p>}
      {recipe.label_allergens && <p className="mt-3 text-sm text-muted">Allergens: {recipe.label_allergens}</p>}
      {recipe.label_url && <a href={recipe.label_url} target="_blank" rel="noopener noreferrer" className={`hit mt-4 inline-flex items-center gap-1 text-sm ${linkClass}`}>Official label <ExternalLink size={14} aria-hidden="true" /></a>}
    </>
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
  const [pickedRecipe, setPickedRecipe] = useState<string | null>(null)

  if (itemQuery.isError) return <><PageTitle title="Item" /><ErrorNote retry={itemQuery.refetch} /></>
  if (itemQuery.isPending) return <><PageTitle title="Item" /><Loading /></>
  const item = itemQuery.data
  if (!item) return <NotFound />
  if (item.canonical_id) return <Navigate to={`/items/${item.canonical_id}`} replace />

  const image = imageUrl(item.image_path)
  const history = historyQuery.data ?? []
  const recipes = [item, ...item.aliases]
  const multiRecipe = recipes.length > 1
  const recipeIds = new Set(recipes.map(recipe => recipe.id))
  const servedRecipeId = multiRecipe ? history.find(row => row.recipe_id !== null && recipeIds.has(row.recipe_id))?.recipe_id : undefined
  const defaultRecipe = recipes.find(recipe => recipe.id === servedRecipeId) ?? item
  const servedToday = history.some(row => row.date === today && row.recipe_id === defaultRecipe.id)
  const selected = recipes.find(recipe => recipe.id === pickedRecipe) ?? defaultRecipe
  const defaultName = servedToday ? "today's version" : servedRecipeId ? 'the latest version' : `version ${recipes.indexOf(defaultRecipe) + 1}`
  const nextRecipe = recipes[(recipes.indexOf(selected) + 1) % recipes.length]
  const todayHalls = groupHalls(history.filter(row => row.date === today))
  const lastHalls = groupHalls(history.filter(row => row.date === item.last_seen))
  const days = historyDays(history)
  const runs = historyRuns(days)
  const top = topHall(days)

  return (
    <article>
      <PageTitle title={item.name} description={itemDescription(item)} />
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
            <RecipeNutrition recipe={selected} />
            {multiRecipe && (
              <p aria-live="polite" className="mt-5 border-t border-line pt-4 text-sm text-muted">
                UMD lists {recipes.length} versions of this dish. Showing {selected.id === defaultRecipe.id ? defaultName : `version ${recipes.indexOf(selected) + 1}`}.{' '}
                <button type="button" onClick={() => setPickedRecipe(nextRecipe.id)} className={linkClass}>{nextRecipe.id === defaultRecipe.id ? `Back to ${defaultName}` : 'Show another version'}</button>
              </p>
            )}
          </Panel>

          <Panel id="item-ingredients" title="Ingredients" icon={Wheat} tone={tones.citrus}>
            {multiRecipe && !(sameTags(selected.recipe_allergens, item.allergens) && sameTags(selected.recipe_dietary, item.dietary)) && <div className="mb-3"><Badges allergens={selected.recipe_allergens} dietary={selected.recipe_dietary} /></div>}
            <RecipeIngredients recipe={selected} />
          </Panel>

          <Panel id="item-history" title="History" icon={CalendarDays} tone={tones.grape}>
            {historyQuery.isError ? <ErrorNote retry={historyQuery.refetch} /> : historyQuery.isPending ? <Loading inline /> : (
              days.length ? (
                <>
                  <p className="text-sm text-muted">
                    Served <span className="font-semibold text-ink tabular-nums">{days.length} {days.length === 1 ? 'day' : 'days'}</span>
                    {item.first_seen && ` since ${formatMonthDay(item.first_seen)}`}
                    {top && ` · ${top.days === days.length ? 'At' : 'Most often at'} ${top.name}`}
                  </p>
                  <div className="mt-4"><HistoryCalendar days={days} today={today} /></div>
                  <Disclosure className="mt-4" summary="Show dates and halls">
                    <HistoryRunList runs={runs.slice(0, 25)} today={today} />
                  </Disclosure>
                </>
              ) : <p className="text-muted">Not served yet</p>
            )}
          </Panel>
        </div>
      </div>
    </article>
  )
}
