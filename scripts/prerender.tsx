import { createClient } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Database } from '../src/lib/database.types'
import { addDays, todayET } from '../src/lib/dates'
import { getPageSeo, renderSeoHead, SITE_URL } from '../src/lib/seo'
import Layout from '../src/components/Layout'
import { NotFound } from '../src/components/UI'
import Home from '../src/pages/Home'
import Hall from '../src/pages/Hall'
import Hours from '../src/pages/Hours'
import Item from '../src/pages/Item'
import Privacy from '../src/pages/Privacy'
import Search from '../src/pages/Search'
import Terms from '../src/pages/Terms'
import Account from '../src/pages/Account'

type Table = Database['public']['Tables']
type HallRow = Table['halls']['Row']
type ItemRow = Table['items']['Row']
type HoursRow = Table['hours']['Row']

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY for prerender')
const supabase = createClient<Database>(url, key)
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
const today = todayET()
const endOfWeek = addDays(today, 6)
const shell = await readFile(join(process.cwd(), 'dist/index.html'), 'utf8')

function assertData<T>(data: T[] | null, error: { message: string } | null, label: string): T[] {
  if (error) throw new Error(`Failed to fetch ${label}: ${error.message}`)
  if (!data) throw new Error(`Failed to fetch ${label}: no data returned`)
  return data
}

async function fetchHalls(): Promise<HallRow[]> {
  const { data, error } = await supabase.from('halls').select('*').order('name')
  return assertData(data, error, 'halls')
}
async function fetchHours(from: string, to: string): Promise<HoursRow[]> {
  const { data, error } = await supabase.from('hours').select('*').gte('date', from).lte('date', to)
  return assertData(data, error, `hours ${from}–${to}`)
}
async function fetchOfferings(hallId: number, date: string) {
  const { data, error } = await supabase.from('offerings').select('meal,station,portion,item:items(id,name,image_path,allergens,dietary,rating_avg,rating_count)').eq('hall_id', hallId).eq('date', date)
  return assertData(data, error, `menu for hall ${hallId} on ${date}`)
}
async function fetchPopular(date: string, hallId?: number) {
  const { data, error } = await supabase.rpc('popular_items', { p_date: date, ...(hallId !== undefined ? { p_hall: hallId } : {}), p_limit: 12 })
  if (error) throw new Error(`Failed to fetch popular items for ${date}: ${error.message}`)
  if (!data) throw new Error(`Failed to fetch popular items for ${date}: no data returned`)
  return data
}
async function fetchCatalog(): Promise<ItemRow[]> {
  const all: ItemRow[] = []
  const pageSize = 1000
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase.from('items').select('*').order('id').range(start, start + pageSize - 1)
    if (error) throw new Error(`Failed to fetch item catalog at row ${start}: ${error.message}`)
    if (!data) throw new Error(`Failed to fetch item catalog at row ${start}: no data returned`)
    all.push(...data)
    if (data.length < pageSize) return all
  }
}
async function fetchHistory(id: string) {
  const { data, error } = await supabase.from('offerings').select('date,meal,station,hall:halls(slug,name)').eq('item_id', id).order('date', { ascending: false }).limit(300)
  return assertData(data, error, `history for item ${id}`)
}

const routeSet = <Routes>
  <Route element={<Layout />}>
    <Route path="/" element={<Home />} />
    <Route path="/halls/:slug" element={<Hall />} />
    <Route path="/items/:id" element={<Item />} />
    <Route path="/search" element={<Search />} />
    <Route path="/hours" element={<Hours />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/account" element={<Account />} />
    <Route path="*" element={<NotFound />} />
  </Route>
</Routes>

function withSeo(path: string, title: string | undefined, content: string) {
  const seo = getPageSeo(path, title)
  const head = renderSeoHead(seo)
  const cleanShell = shell.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta\s+name="description"[^>]*\/?\s*>/i, '')
  if (!cleanShell.includes('</head>')) throw new Error('Built index.html has no closing </head>')
  return cleanShell.replace('</head>', `${head}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${content}</div>`)
}
async function writePage(path: string, pathname: string, title?: string, seoPath = pathname) {
  const markup = renderToString(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[pathname]}>{routeSet}</MemoryRouter></QueryClientProvider>)
  const file = join(process.cwd(), 'dist', path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, withSeo(seoPath, title, markup))
}

const halls = await fetchHalls()
const hours = await fetchHours(today, endOfWeek)
const catalog = await fetchCatalog()
const popular = await fetchPopular(today)
queryClient.setQueryData(['halls'], halls)
queryClient.setQueryData(['hours', today, today], hours.filter(row => row.date === today))
queryClient.setQueryData(['hours', today, endOfWeek], hours)
queryClient.setQueryData(['popular', today, undefined], popular)
await writePage('index.html', '/')
await writePage('hours.html', '/hours')
await writePage('privacy.html', '/privacy')
await writePage('terms.html', '/terms')
await writePage('search.html', '/search')
await writePage('account.html', '/account')

const sitemap: string[] = ['/', '/hours', '/privacy', '/terms'].map(path => `${SITE_URL}${path}`)
for (const hall of halls) {
  const offerings = await fetchOfferings(hall.id, today)
  const hallPopular = await fetchPopular(today, hall.id)
  queryClient.setQueryData(['hallMenu', hall.id, today], offerings)
  queryClient.setQueryData(['popular', today, hall.id], hallPopular)
  await writePage(`halls/${encodeURIComponent(hall.slug)}.html`, `/halls/${hall.slug}`, hall.name)
  sitemap.push(`${SITE_URL}/halls/${encodeURIComponent(hall.slug)}`)
  queryClient.removeQueries({ queryKey: ['hallMenu', hall.id, today] })
  queryClient.removeQueries({ queryKey: ['popular', today, hall.id] })
}

// Render catalog details in small batches so at most six histories are in flight or retained.
const concurrency = 6
for (let start = 0; start < catalog.length; start += concurrency) {
  const batch = catalog.slice(start, start + concurrency)
  const histories = await Promise.all(batch.map(item => fetchHistory(item.id)))
  for (let offset = 0; offset < batch.length; offset++) {
    const item = batch[offset]!
    queryClient.setQueryData(['item', item.id], item)
    queryClient.setQueryData(['history', item.id], histories[offset])
    await writePage(`items/${encodeURIComponent(item.id)}.html`, `/items/${item.id}`, item.name)
    sitemap.push(`${SITE_URL}/items/${encodeURIComponent(item.id)}`)
    queryClient.removeQueries({ queryKey: ['item', item.id] })
    queryClient.removeQueries({ queryKey: ['history', item.id] })
  }
}

queryClient.clear()
await writePage('item-shell.html', '/items/_pending', 'Food item', '/item-shell')
await writePage('404.html', '/__prerender_not_found__', 'Not found')
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(value => `  <url><loc>${value.replaceAll('&', '&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`
await writeFile(join(process.cwd(), 'dist/sitemap.xml'), xml)
await writeFile(join(process.cwd(), 'dist/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`)
console.log(`Prerendered ${sitemap.length} indexable URLs.`)
