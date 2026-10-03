import { describe, expect, it } from 'vitest'
import { addDays, todayET, nowMinutesET } from './dates'
import { defaultMeal, hallStatus, mealStatus, type Hours } from './hours'
import { filterItems, pickFavorites, rankTopRated } from './menu'
import { pageWindow } from './pagination'
const lunch: Hours = { hall_id: 19, date: '2026-10-02', meal: 'Lunch', status: 'open', label: '10:30am-4pm', opens: '10:30:00', closes: '16:00:00' }
describe('Eastern calendar', () => {
  it('keeps UTC midnight on the previous Eastern day', () => {
    expect(todayET(new Date('2026-10-03T03:30:00Z'))).toBe('2026-10-02')
    expect(nowMinutesET(new Date('2026-10-03T03:30:00Z'))).toBe(23 * 60 + 30)
  })
  it('adds calendar days across DST', () => expect(addDays('2026-11-01', 1)).toBe('2026-11-02'))
})
describe('dining hours', () => {
  it('opens at the boundary and closes at the boundary', () => {
    expect(mealStatus(lunch, 629)).toBe('upcoming')
    expect(mealStatus(lunch, 630)).toBe('open')
    expect(mealStatus(lunch, 960)).toBe('past')
    expect(hallStatus([lunch], 660).label).toBe('Open · Lunch until 4pm')
  })
  it('keeps Dinner selected after closing', () => {
    expect(defaultMeal([{ ...lunch, meal: 'Dinner', opens: '16:00:00', closes: '21:00:00' }], 1290, true)).toBe('Dinner')
  })
})
it('excludes avoided allergens and requires all diets', () => {
  const dairy = { allergens: ['dairy'], dietary: ['vegetarian'] }
  const vegan = { allergens: [], dietary: ['vegan', 'vegetarian'] }
  expect(filterItems([dairy, vegan], { diet: [], avoid: ['dairy'] })).toEqual([vegan])
  expect(filterItems([dairy, vegan], { diet: ['vegan', 'vegetarian'], avoid: [] })).toEqual([vegan])
})
it('picks favorites once across stations, keeping the first copy and sorting by name', () => {
  const zucchini = { id: 'z', name: 'Zucchini', station: 'Grill' }
  const apple = { id: 'a', name: 'Apple', station: 'Fruit' }
  expect(pickFavorites([zucchini, { ...zucchini, station: 'Other' }, { id: 'b', name: 'Bread', station: 'Bakery' }, apple], new Set(['z', 'a']))).toEqual([apple, zucchini])
})
describe('top-rated ranking', () => {
  const item = (id: string, name: string, rating_count: number, rating_sum: number) => ({
    id, name, rating_count, rating_sum, rating_avg: rating_count ? rating_sum / rating_count : null,
    image_path: null, allergens: [], dietary: [],
  })
  it('uses a Bayesian prior, deduplicates, excludes unrated items, and honors the limit', () => {
    const highSingle = item('single', 'Single vote', 1, 5)
    const reliable = item('reliable', 'Reliable', 40, 184)
    const unrated = item('unrated', 'Unrated', 0, 0)
    expect(rankTopRated([highSingle, reliable, { ...reliable, name: 'Duplicate' }, unrated], 1)).toEqual([reliable])
    expect(rankTopRated([highSingle, reliable, { ...reliable, name: 'Duplicate' }, unrated])).toEqual([reliable, highSingle])
  })
})
describe('search pagination window', () => {
  it('keeps first, last, and nearby pages separated by gaps', () => {
    expect(pageWindow(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10])
    expect(pageWindow(1, 10)).toEqual([1, 2, 'gap', 10])
    expect(pageWindow(2, 3)).toEqual([1, 2, 3])
    expect(pageWindow(1, 1)).toEqual([1])
  })
})
