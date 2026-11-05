import { expect, it } from 'vitest'
import { markAllergens } from './allergens'

const bold = (text: string) => {
  const parts = markAllergens(text)
  expect(parts.map(part => part.text).join('')).toBe(text)
  return parts.filter(part => part.allergen).map(part => part.text)
}

it('bolds allergen sources in a label', () => {
  expect(bold('Liquid Eggs  2/20 lb (Whole Egg, Citric Acid. contains: Eggs.), Shredded Cheddar Cheese (Pasteurized Milk, Cheese Culture)'))
    .toEqual(['Eggs', 'Egg', 'Eggs', 'Cheese', 'Milk', 'Cheese'])
})
it('leaves false positives plain', () => {
  expect(bold('Coconut Milk, Cocoa Butter, Nutmeg, Eggplant, Buckwheat, Butternut Squash')).toEqual([])
})
it('ignores free-from claims but keeps other allergens', () => {
  expect(bold('Lite Soy Sauce Gluten Free, Pesto Sauce Nut-Free, Wheat Flour')).toEqual(['Soy', 'Wheat'])
})
it('returns nothing for empty text', () => expect(markAllergens('')).toEqual([]))
