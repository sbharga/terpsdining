import { describe, expect, it } from 'vitest'
import { getPageSeo, itemDescription, renderSeoHead, SITE_URL } from './seo'

describe('page SEO metadata', () => {
  it('uses the production origin and excludes query strings from route canonicals', () => {
    expect(getPageSeo('/halls/diner?meal=lunch&date=2026-10-03').canonical).toBe(`${SITE_URL}/halls/diner`)
    expect(getPageSeo('/').canonical).toBe(`${SITE_URL}/`)
  })


  it('marks missing routes, account, and the item shell noindex', () => {
    expect(getPageSeo('/account').robots).toBe('noindex,follow')
    expect(getPageSeo('/missing-route').robots).toBe('noindex,follow')
    expect(getPageSeo('/item-shell').robots).toBe('noindex,follow')
    expect(getPageSeo('/item-shell').canonical).toBe('')
  })

  it('indexes the search directory page', () => {
    expect(getPageSeo('/search').robots).toBe('index,follow')
    expect(getPageSeo('/search?q=chicken').canonical).toBe(`${SITE_URL}/search`)
  })

  it('builds item descriptions from nutrition, diet, and allergens', () => {
    expect(itemDescription({ name: 'Berbere Spiced Chicken', nutrition: { calories: 133, serving_size: '4 oz', nutrients: [{ name: 'Protein', amount: '21.3g' }] }, dietary: ['halal'], allergens: [] }))
      .toBe('Berbere Spiced Chicken at UMD dining halls: 133 calories, 21.3g protein per 4 oz serving. Halal. Nutrition facts, ingredients, allergens, and serving history.')
    expect(itemDescription({ name: 'X', nutrition: null, dietary: [], allergens: ['dairy', 'gluten'] }))
      .toBe('X at UMD dining halls. Contains dairy, gluten. Nutrition facts, ingredients, allergens, and serving history.')
    expect(getPageSeo('/items/1', 'X', 'custom').description).toBe('custom')
  })

  it('escapes dynamic metadata before emitting raw HTML', () => {
    const html = renderSeoHead(getPageSeo('/items/17', '<b>Food & "More"</b>'))
    expect(html).toContain('&lt;b&gt;Food &amp; &quot;More&quot;&lt;/b&gt;')
    expect(html).not.toContain('<b>Food')
  })
})
