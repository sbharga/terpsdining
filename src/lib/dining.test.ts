import { describe, expect, it } from 'vitest'
import { addDays, todayET, nowMinutesET } from './dates'
import { defaultMeal, hallStatus, mealStatus, type Hours } from './hours'
import { filterItems } from './menu'
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
