import { describe, expect, it } from 'vitest'
import { mapTargets } from './hallMap'

const stations: Record<string, Record<string, string[]>> = {
  '251-north': {
    'chefs-table': ["Chef's Table Extras", "Chef's Table Mains", "Chef's Table Vegetarian", "Halal at Chef's Table"],
    ciao: ['Ciao All-Day', 'Ciao Chilled Salads', 'Ciao Entree', 'Ciao Pasta', 'Ciao Pizza'],
    harvest: ['Harvest Daily Breakfast', 'Harvest Entree', 'Harvest Greens', 'Harvest Vegan', 'Harvest Vegan Breakfast', 'Soups'],
    smash: ['Smash Breakfast', 'Smash Burger', 'Smash Deli', 'Smash Hot Sub'],
    'purple-zone': ['Purple Zone', 'Purple Zone-ALL DAY'],
    chillz: ['CHILLZ'],
  },
  'south-campus': {
    'purple-zone': ['Purple Zone', 'Purple Zone Sides'],
    pizza: ['Pizza'],
    pasta: ['Pasta'],
    'broiler-works': ['Broiler Works', 'Broiler Works Sides'],
    'grill-works': ['Grill Works', 'Grill Works Sides'],
    'chefs-table': ["Chef's Table", "Chef's Table Sides"],
    roaster: ['Roaster', 'Roaster Sides'],
    treats: ['Treats'],
    'deli-plus': ['Deli+'],
    deli: ['Deli'],
    waffles: ['Waffle', 'Doughnut', 'Bagel Bar'],
    'salad-bar': ['Salad Bar', 'Soup Du Jour'],
    desserts: ['Vegan Desserts'],
    'mongolian-grill': ['Mongolian Grill', 'Mongolian Grill Made to Ord'],
    roma: ['Roma Vegan Salads and Panini', 'Roma Vegan Sides'],
  },
  yahentamitsi: {
    'center-station': ['Terp Comfort', 'Terp Comfort Sides', 'Al Forno Pastas'],
    sprouts: ['Sprouts', 'Sprouts Sides'],
    'gluten-free': ['Good Food Gluten Free', 'Good Food GF Sides'],
    'chefs-corner': ["Chef's Corner", "Chef's Corner Sides", 'Terp Latin', 'Terp Latin Sides'],
    mezza: ['Mezza', 'Mezza Sides'],
    'salad-bar': ['Salad Bar'],
    'md-bakery': ['Maryland Bakery'],
    'joes-grill': ["Joe's Grill", "Joe's Grill Sides"],
    woks: ['Woks'],
    'breakfast-grill': ['Breakfast', 'Breakfast Sides'],
  },
}

describe('mapTargets', () => {
  for (const [slug, counters] of Object.entries(stations)) {
    for (const [id, names] of Object.entries(counters)) {
      for (const name of names) {
        it(`${slug}: ${name} -> ${id}`, () => { expect(mapTargets(slug, [name]).areas.get(id)).toBe(0) })
      }
    }
  }

  it('keeps Deli and Deli+ apart', () => {
    const { areas } = mapTargets('south-campus', ['Deli', 'Deli+'])
    expect(areas.get('deli')).toBe(0)
    expect(areas.get('deli-plus')).toBe(1)
  })

  it('points a counter at its first section', () => {
    const { areas, others } = mapTargets('251-north', ["Chef's Table Extras", "Chef's Table Mains", 'Mystery Station', 'CHILLZ'])
    expect(Object.fromEntries(areas)).toEqual({ 'chefs-table': 0, chillz: 3 })
    expect(others).toEqual([2])
  })

  it('sends every station to others for an unknown hall', () => {
    expect(mapTargets('new-hall', ['A', 'B'])).toEqual({ areas: new Map(), others: [0, 1] })
  })
})
