import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { addDays, formatDay, todayET } from '../lib/dates'
import type { CardItem } from '../lib/menu'
import { getPageSeo, renderSeoJsonLd } from '../lib/seo'
import { imageUrl } from '../lib/supabase'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Heart, Leaf, LoaderCircle, Moon, RotateCcw, Sprout, Star, Sun, Sunrise, TriangleAlert, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { HallState, Meal } from '../lib/hours'
import { dietTone, mealTones, nameTone, tones, type Tone } from '../lib/theme'
export function PageTitle({ title }: { title: string }) {
  const { pathname, search } = useLocation()
  useEffect(() => {
    const seo = getPageSeo(pathname, title)
    document.title = seo.title
    const tags: Array<[string, string]> = [
      ['meta[name="description"]', seo.description],
      ['meta[name="robots"]', seo.robots],
      ['link[rel="canonical"]', seo.canonical],
      ['meta[property="og:type"]', 'website'],
      ['meta[property="og:site_name"]', 'TerpsDining'],
      ['meta[property="og:title"]', seo.title],
      ['meta[property="og:description"]', seo.description],
      ['meta[property="og:url"]', seo.canonical],
      ['meta[property="og:image"]', seo.image],
      ['meta[property="og:image:alt"]', seo.imageAlt],
      ['meta[property="og:image:width"]', '1200'],
      ['meta[property="og:image:height"]', '630'],
      ['meta[name="twitter:card"]', 'summary_large_image'],
      ['meta[name="twitter:title"]', seo.title],
      ['meta[name="twitter:description"]', seo.description],
      ['meta[name="twitter:image"]', seo.image],
      ['meta[name="twitter:image:alt"]', seo.imageAlt],
    ]
    for (const [selector, content] of tags) {
      const matches = document.head.querySelectorAll(selector)
      if (selector.startsWith('link') && !content) {
        for (const match of matches) match.remove()
        continue
      }
      const tag = matches[0] ?? document.head.appendChild(document.createElement(selector.startsWith('link') ? 'link' : 'meta'))
      for (const duplicate of Array.from(matches).slice(1)) duplicate.remove()
      if (selector.startsWith('link')) {
        tag.setAttribute('rel', 'canonical')
        tag.setAttribute('href', content)
      } else {
        const attribute = selector.includes('[property=') ? 'property' : 'name'
        tag.setAttribute(attribute, selector.match(/\[(?:name|property)="([^"]+)"/)?.[1] ?? '')
        tag.setAttribute('content', content)
      }
    }
    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]')
    const script = scripts[0] ?? document.head.appendChild(document.createElement('script'))
    for (const duplicate of Array.from(scripts).slice(1)) duplicate.remove()
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute('data-terpsdining-seo', '')
    script.textContent = renderSeoJsonLd()
  }, [pathname, search, title])
  return null
}
export function Loading({ inline = false }: { inline?: boolean }) {
  if (inline) return <p role="status" className="flex items-center gap-2 py-2 text-sm text-muted"><LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />Loading…</p>
  return <div role="status" className="grid gap-4 py-2 sm:grid-cols-2"><span className="sr-only">Loading…</span>{[0, 1, 2, 3].map(n => <div key={n} aria-hidden="true" className="flex gap-4 rounded-2xl bg-surface p-4 ring-1 ring-line"><div className="h-20 w-20 rounded-xl bg-surface-2 motion-safe:animate-pulse" /><div className="flex-1 space-y-3 py-2"><div className="h-4 w-2/3 rounded-full bg-surface-2 motion-safe:animate-pulse" /><div className="h-3 w-1/3 rounded-full bg-surface-2 motion-safe:animate-pulse" /></div></div>)}</div>
}
export function NotFound() {
  return <><PageTitle title="Not found" /><div className="flex flex-col items-center py-16 text-center"><div className={`grid h-16 w-16 place-items-center rounded-3xl text-white ${tones.tomato.solid}`}><UtensilsCrossed size={30} aria-hidden="true" /></div><h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight">Page not found</h1><p className="mt-2 text-muted">This dish isn't on today's menu.</p><Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-semibold text-brand-ink hover:brightness-110"><ArrowLeft size={18} aria-hidden="true" />Back to today</Link></div></>
}
export function ErrorNote({ retry }: { retry: () => unknown }) {
  return <div role="alert" className="my-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100"><TriangleAlert size={18} aria-hidden="true" /><span className="flex-1">Couldn't load.</span><button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 font-semibold ring-1 ring-red-200 hover:bg-red-100 dark:ring-red-400/30 dark:hover:bg-red-400/20" onClick={() => void retry()}><RotateCcw size={14} aria-hidden="true" />Retry</button></div>
}
export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return <div className="mt-8 flex flex-col items-center rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted"><Icon size={26} aria-hidden="true" /></div><p className="mt-4 font-display text-lg font-bold">{title}</p>{children && <div className="mt-2 text-sm text-muted">{children}</div>}</div>
}
export function SectionHeading({ id, icon: Icon, tone, children }: { id?: string; icon: LucideIcon; tone: Tone; children: ReactNode }) {
  return <h2 id={id} className="flex items-center gap-3 font-display text-xl font-bold sm:text-2xl"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone.soft}`}><Icon size={18} aria-hidden="true" /></span>{children}</h2>
}
export function Panel({ id, title, icon, tone, children }: { id?: string; title: string; icon: LucideIcon; tone: Tone; children: ReactNode }) {
  return <section aria-labelledby={id} className="rounded-3xl bg-surface p-5 ring-1 ring-line sm:p-6"><SectionHeading id={id} icon={icon} tone={tone}>{title}</SectionHeading><div className="mt-4">{children}</div></section>
}
export function MealIcon({ meal, size = 16 }: { meal: Meal; size?: number }) {
  const Icon = { Breakfast: Sunrise, Lunch: Sun, Dinner: Moon }[meal]
  return <Icon size={size} className={tones[mealTones[meal]].text} aria-hidden="true" />
}
export function DietIcon({ tag, size = 12 }: { tag: string; size?: number }) {
  const Icon = tag === 'vegan' ? Sprout : tag === 'halal' ? CircleCheck : Leaf
  return <Icon size={size} aria-hidden="true" />
}
export function StatusPill({ status }: { status: { label: string; state: HallState } }) {
  const color = status.state === 'open' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200' : status.state === 'upcoming' ? 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200' : 'bg-surface-2 text-muted'
  const dot = status.state === 'open' ? 'bg-emerald-500' : status.state === 'upcoming' ? 'bg-amber-500' : 'bg-muted/60'
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${color}`}><span aria-hidden="true" className="relative flex h-2 w-2">{status.state === 'open' && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 motion-safe:animate-ping" />}<span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} /></span>{status.label}</span>
}
export function RatingPill({ avg, count }: { avg: number | null; count: number }) {
  if (!count || avg === null) return null
  const color = avg >= 4
    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200'
    : avg >= 3
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200'
      : 'bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-200'
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold ${color}`}><Star size={14} fill="currentColor" aria-hidden="true" />{avg.toFixed(1)}<span className="sr-only"> out of 5 stars,</span><span className="font-normal opacity-70">({count})</span></span>
}
export function FoodSwatch({ name, className }: { name: string; className: string }) {
  return <span aria-hidden="true" className={`flex shrink-0 items-center justify-center font-display font-extrabold text-white drop-shadow-sm ${nameTone(name).solid} ${className}`}>{name.charAt(0)}</span>
}
export function Badges({ allergens, dietary }: { allergens: string[]; dietary: string[] }) {
  return <div className="flex flex-wrap gap-1.5">{dietary.map(tag => <span key={tag} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${dietTone(tag).soft}`}><DietIcon tag={tag} />{tag}</span>)}{allergens.map(tag => <span key={tag} className="rounded-full border border-line px-2 py-0.5 text-xs capitalize text-muted">{tag}</span>)}</div>
}
export function ItemCard({ item, children, favorite = false }: { item: CardItem; children?: ReactNode; favorite?: boolean }) {
  const image = imageUrl(item.image_path, 'thumb')
  return <Link to={`/items/${item.id}`} className="group flex gap-4 rounded-2xl bg-surface p-3 ring-1 ring-line transition hover:-translate-y-0.5 motion-reduce:transform-none">
    {image ? <img src={image} alt="" width={80} height={80} loading="lazy" decoding="async" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <FoodSwatch name={item.name} className="h-20 w-20 rounded-xl text-3xl" />}
    <div className="min-w-0 flex-1 py-0.5"><h3 className="font-semibold leading-snug group-hover:text-brand">{item.name}{favorite && <><Heart size={14} fill="currentColor" aria-hidden="true" className="ml-1.5 inline align-[-2px] text-fuchsia-600 dark:text-fuchsia-300" /><span className="sr-only"> (favorite)</span></>}</h3><div className="mt-2"><Badges allergens={item.allergens} dietary={item.dietary} /></div>{item.rating_count > 0 && <div className="mt-2"><RatingPill avg={Number(item.rating_avg)} count={item.rating_count} /></div>}{children}</div>
  </Link>
}
export function StarRating({ value, onChange, disabled = false }: { value: number | null; onChange: (value: number | null) => void; disabled?: boolean }) {
  return <div><div role="radiogroup" aria-label="Your rating" className="flex gap-2">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`Rate ${n} stars`} disabled={disabled} onClick={() => onChange(n === value ? null : n)} className="rounded-xl p-1.5 transition hover:scale-110 hover:bg-amber-50 disabled:opacity-50 motion-reduce:hover:scale-100 dark:hover:bg-amber-400/10"><Star size={32} aria-hidden="true" fill={n <= (value ?? 0) ? 'currentColor' : 'none'} className={n <= (value ?? 0) ? 'text-amber-400' : 'text-muted/40'} /></button>)}</div><p className="mt-2 text-sm text-muted">{value ? `You rated this ${value}/5 · tap it again to clear` : 'Tap a star to rate'}</p></div>
}
export function DatePager({ date, onChange, step = 1 }: { date: string; onChange: (date: string) => void; step?: number }) {
  const today = todayET()
  return <div className="flex flex-wrap items-center gap-2"><div className="inline-flex items-center rounded-full bg-surface p-1 ring-1 ring-line"><button type="button" aria-label={step === 7 ? 'Previous week' : 'Previous day'} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink sm:h-9 sm:w-9" onClick={() => onChange(addDays(date, -step))}><ChevronLeft size={18} aria-hidden="true" /></button><span aria-live="polite" className="flex min-w-36 items-center justify-center gap-2 px-2 text-sm font-semibold"><CalendarDays size={16} className="text-brand" aria-hidden="true" /><time dateTime={date}>{formatDay(date)}</time></span><button type="button" aria-label={step === 7 ? 'Next week' : 'Next day'} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink sm:h-9 sm:w-9" onClick={() => onChange(addDays(date, step))}><ChevronRight size={18} aria-hidden="true" /></button></div>{date !== today && <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-surface" onClick={() => onChange(today)}>{step === 7 ? 'This week' : 'Today'}</button>}</div>
}
