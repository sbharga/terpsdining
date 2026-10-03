import { describe, expect, it } from 'vitest'
import { getPageSeo, renderSeoHead, SITE_URL } from './seo'

describe('page SEO metadata', () => {
  it('uses the production origin and excludes query strings from route canonicals', () => {
    expect(getPageSeo('/halls/diner?meal=lunch&date=2026-10-03').canonical).toBe(`${SITE_URL}/halls/diner`)
    expect(getPageSeo('/').canonical).toBe(`${SITE_URL}/`)
  })


  it('marks search, missing routes, and the item shell noindex', () => {
    expect(getPageSeo('/search').robots).toBe('noindex,follow')
    expect(getPageSeo('/missing-route').robots).toBe('noindex,follow')
    expect(getPageSeo('/item-shell').robots).toBe('noindex,follow')
    expect(getPageSeo('/item-shell').canonical).toBe('')
  })

  it('escapes dynamic metadata before emitting raw HTML', () => {
    const html = renderSeoHead(getPageSeo('/items/17', '<b>Food & "More"</b>'))
    expect(html).toContain('&lt;b&gt;Food &amp; &quot;More&quot;&lt;/b&gt; Nutrition &amp; Availability')
    expect(html).not.toContain('<b>Food')
  })
})
