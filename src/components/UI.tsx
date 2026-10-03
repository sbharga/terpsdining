import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { addDays, formatDay } from '../lib/dates'
import type { CardItem } from '../lib/menu'
import { getPageSeo, renderSeoJsonLd } from '../lib/seo'
import { imageUrl } from '../lib/supabase'
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
export function Loading() { return <p role="status" className="py-8 text-sm text-zinc-500">Loading…</p> }
export function NotFound() { return <><PageTitle title="Not found" /><h1 className="text-3xl font-semibold">Page not found</h1><Link className="mt-4 inline-block text-brand" to="/">Back to today</Link></> }
export function ErrorNote({ retry }: { retry: () => unknown }) {
  return <p role="alert" className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">Couldn't load. <button className="font-semibold underline" onClick={() => void retry()}>Retry</button></p>
}
export function Badges({ allergens, dietary }: { allergens: string[]; dietary: string[] }) {
  return <div className="flex flex-wrap gap-1.5">{dietary.map(tag => <span key={tag} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium capitalize text-emerald-800">{tag}</span>)}{allergens.map(tag => <span key={tag} className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs capitalize text-zinc-600">{tag}</span>)}</div>
}
export function ItemCard({ item, children }: { item: CardItem; children?: ReactNode }) {
  const image = imageUrl(item.image_path)
  return <Link to={`/items/${item.id}`} className="group flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 hover:shadow-sm">
    {image ? <img src={image} alt="" width={64} height={64} loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-lg object-cover" /> : <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl text-zinc-400">{item.name[0]}</span>}
    <div className="min-w-0 flex-1"><h3 className="mb-2 font-medium group-hover:text-brand">{item.name}</h3><Badges allergens={item.allergens} dietary={item.dietary} />{item.rating_count > 0 && <p className="mt-2 text-sm text-zinc-600">★ {Number(item.rating_avg).toFixed(1)} ({item.rating_count})</p>}{children}</div>
  </Link>
}
export function StarRating({ value, onChange, disabled = false }: { value: number | null; onChange?: (value: number | null) => void; disabled?: boolean }) {
  if (!onChange) return <span aria-label={`${value ?? 0} stars`} className="text-amber-500">{'★'.repeat(Math.round(value ?? 0))}{'☆'.repeat(5 - Math.round(value ?? 0))}</span>
  return <div role="radiogroup" aria-label="Your rating" className="flex gap-2">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`Rate ${n} stars`} disabled={disabled} onClick={() => onChange(n === value ? null : n)} className={`rounded-lg px-2 py-1 text-3xl disabled:opacity-50 ${n <= (value ?? 0) ? 'text-amber-500' : 'text-zinc-300'}`}>★</button>)}</div>
}
export function DatePager({ date, onChange, step = 1 }: { date: string; onChange: (date: string) => void; step?: number }) {
  return <div className="flex items-center gap-4"><button aria-label={step === 7 ? 'Previous week' : 'Previous day'} className="rounded-lg border border-zinc-200 px-3 py-1 text-xl" onClick={() => onChange(addDays(date, -step))}>‹</button><span className="min-w-28 text-center text-sm font-medium">{formatDay(date)}</span><button aria-label={step === 7 ? 'Next week' : 'Next day'} className="rounded-lg border border-zinc-200 px-3 py-1 text-xl" onClick={() => onChange(addDays(date, step))}>›</button></div>
}
