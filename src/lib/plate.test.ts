import { describe, expect, it } from 'vitest'
import { formatAmount, plateTotals, type NutritionDetails } from './nutrition'
import { MAX_SERVINGS, parsePlate, setServings, type PlateEntry } from './plate'

const nutrition = (calories: number | null, nutrients: { name: string; amount: string }[]): NutritionDetails => ({
  servings: null, servingSize: null, calories, nutrients: nutrients.map(n => ({ ...n, dv: null })),
})

describe('plateTotals', () => {
  const a = nutrition(241, [{ name: 'Total Fat', amount: '17.5g' }, { name: 'Protein', amount: '20 g' }, { name: 'Vitamin D', amount: 'n/a' }])
  const b = nutrition(100, [{ name: 'Protein', amount: '5g' }])

  it('scales by servings, skips unparseable amounts, and counts missing entries', () => {
    expect(plateTotals([{ servings: 2, nutrition: a }, { servings: 1, nutrition: b }, { servings: 3, nutrition: null }])).toEqual({
      calories: 582,
      nutrients: [{ name: 'Total Fat', unit: 'g', amount: 35 }, { name: 'Protein', unit: 'g', amount: 45 }],
      counted: 2,
      missing: 1,
    })
  })
  it('treats null calories as missing', () => {
    expect(plateTotals([{ servings: 1, nutrition: nutrition(null, [{ name: 'Protein', amount: '5g' }]) }])).toEqual({ calories: 0, nutrients: [], counted: 0, missing: 1 })
  })
  it('handles an empty plate', () => {
    expect(plateTotals([])).toEqual({ calories: 0, nutrients: [], counted: 0, missing: 0 })
  })
  it('keeps units separate for the same nutrient name', () => {
    const totals = plateTotals([{ servings: 1, nutrition: nutrition(1, [{ name: 'Sodium', amount: '1mg' }, { name: 'Sodium', amount: '2g' }]) }])
    expect(totals.nutrients).toEqual([{ name: 'Sodium', unit: 'mg', amount: 1 }, { name: 'Sodium', unit: 'g', amount: 2 }])
  })
})

describe('parsePlate', () => {
  it('returns empty for missing or malformed storage', () => {
    expect(parsePlate(null)).toEqual([])
    expect(parsePlate('not json')).toEqual([])
    expect(parsePlate('{}')).toEqual([])
  })
  it('keeps only valid, first-seen entries', () => {
    const valid = { id: 'a', name: 'Pizza', servings: 2 }
    const raw = JSON.stringify([
      valid,
      { id: 'b', name: 'Zero', servings: 0 },
      { id: 'c', name: 'Frac', servings: 1.5 },
      { id: 'd', name: 'Big', servings: MAX_SERVINGS + 1 },
      { name: 'NoId', servings: 1 },
      { id: 'a', name: 'Dup', servings: 5 },
    ])
    expect(parsePlate(raw)).toEqual([valid])
  })
})

describe('setServings', () => {
  const plate: PlateEntry[] = [{ id: 'a', name: 'A', servings: 1 }, { id: 'b', name: 'B', servings: 2 }]
  it('appends a new item', () => {
    expect(setServings(plate, { id: 'c', name: 'C' }, 1)).toEqual([...plate, { id: 'c', name: 'C', servings: 1 }])
  })
  it('updates in place without mutating the input', () => {
    const before = structuredClone(plate)
    expect(setServings(plate, { id: 'a', name: 'A' }, 4)).toEqual([{ id: 'a', name: 'A', servings: 4 }, plate[1]])
    expect(plate).toEqual(before)
  })
  it('removes at zero', () => {
    expect(setServings(plate, { id: 'a', name: 'A' }, 0)).toEqual([plate[1]])
  })
  it('clamps to the maximum', () => {
    expect(setServings(plate, { id: 'b', name: 'B' }, 99)[1].servings).toBe(MAX_SERVINGS)
  })
})

describe('formatAmount', () => {
  it('rounds to one decimal and appends the unit', () => {
    expect(formatAmount(35, 'g')).toBe('35g')
    expect(formatAmount(2.345, 'mg')).toBe('2.3mg')
  })
})
