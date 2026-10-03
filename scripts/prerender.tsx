import { QueryClient, QueryClientProvider, dehydrate, hashKey, type DehydratedState, type QueryKey } from '@tanstack/react-query'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Database } from '../src/lib/database.types'
import { addDays, todayET } from '../src/lib/dates'
import { getPageSeo, renderSeoHead, SITE_URL } from '../src/lib/seo'
import { db } from '../src/lib/supabase'
import { halls } from '../src/lib/halls'
import { hoursQuery, popularQuery, hallMenuQuery, itemQuery, historyQuery, type ItemHistoryRow } from '../src/api/queries'
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
type ItemRow = Table['items']['Row']
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
const today = todayET()
const endOfWeek = addDays(today, 6)
const shell = await readFile(join(process.cwd(), 'dist/index.html'), 'utf8')

async function fetchCatalog(): Promise<ItemRow[]> {
  const all: ItemRow[] = []
  const pageSize = 1000
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await db.from('items').select('*').order('id').range(start, start + pageSize - 1)
    if (error) throw new Error(`Failed to fetch item catalog at row ${start}: ${error.message}`)
    if (!data) throw new Error(`Failed to fetch item catalog at row ${start}: no data returned`)
    all.push(...data)
    if (data.length < pageSize) return all
  }
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

function withSeo(path: string, title: string | undefined, content: string, state: DehydratedState | null) {
  const seo = getPageSeo(path, title)
  const head = renderSeoHead(seo)
  const cleanShell = shell.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta\s+name="description"[^>]*\/?\s*>/i, '')
  if (!cleanShell.includes('</head>')) throw new Error('Built index.html has no closing </head>')
  const cache = state ? `<script id="query-state" type="application/json">${JSON.stringify(state).replaceAll('<', '\\u003c')}</script>` : ''
  return cleanShell.replace('</head>', `${head}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${content}</div>${cache}`)
}
async function writePage(path: string, pathname: string, title?: string, seoPath = pathname, keys: QueryKey[] = []) {
  const markup = renderToString(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[pathname]}>{routeSet}</MemoryRouter></QueryClientProvider>)
  const file = join(process.cwd(), 'dist', path)
  await mkdir(dirname(file), { recursive: true })
  const hashes = new Set(keys.map(key => hashKey(key)))
  const state = keys.length ? dehydrate(queryClient, { shouldDehydrateQuery: query => hashes.has(query.queryHash) }) : null
  await writeFile(file, withSeo(seoPath, title, markup, state))
}

const hours = await queryClient.fetchQuery(hoursQuery(today, endOfWeek))
const catalog = await fetchCatalog()
await queryClient.fetchQuery(popularQuery(today))
queryClient.setQueryData(hoursQuery(today, today).queryKey, hours.filter(row => row.date === today))
await writePage('index.html', '/', undefined, '/', [hoursQuery(today, today).queryKey, popularQuery(today).queryKey])
await writePage('hours.html', '/hours', undefined, '/hours', [hoursQuery(today, endOfWeek).queryKey])
await writePage('privacy.html', '/privacy')
await writePage('terms.html', '/terms')
await writePage('search.html', '/search')
await writePage('account.html', '/account')

const sitemap: string[] = ['/', '/hours', '/privacy', '/terms'].map(path => `${SITE_URL}${path}`)
for (const hall of halls) {
  await queryClient.fetchQuery(hallMenuQuery(hall.id, today))
  await writePage(`halls/${encodeURIComponent(hall.slug)}.html`, `/halls/${hall.slug}`, hall.name, `/halls/${hall.slug}`, [hoursQuery(today, today).queryKey, hallMenuQuery(hall.id, today).queryKey])
  sitemap.push(`${SITE_URL}/halls/${encodeURIComponent(hall.slug)}`)
  queryClient.removeQueries({ queryKey: ['hallMenu', hall.id, today] })
}

for (let start = 0; start < catalog.length; start += 100) {
  const batch = catalog.slice(start, start + 100)
  const { data, error } = await db.rpc('item_histories', { p_ids: batch.map(item => item.id) })
  if (error) throw new Error(`Failed to fetch histories at row ${start}: ${error.message}`)
  const histories = new Map((data ?? []).map(row => [row.item_id, row.history as ItemHistoryRow[]]))
  for (const item of batch) {
    queryClient.setQueryData(itemQuery(item.id).queryKey, item)
    queryClient.setQueryData(historyQuery(item.id).queryKey, histories.get(item.id) ?? [])
    await writePage(`items/${encodeURIComponent(item.id)}.html`, `/items/${item.id}`, item.name, `/items/${item.id}`, [itemQuery(item.id).queryKey, historyQuery(item.id).queryKey])
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
