import { describe, expect, it } from 'vitest'
import { groupByInitial } from './directory'

describe('groupByInitial', () => {
  const groups = groupByInitial([
    { id: '2', name: 'banana' },
    { id: '1', name: ' Apple' },
    { id: '3', name: '7-Layer Bar' },
    { id: '4', name: 'Éclair' },
    { id: '5', name: 'apple' },
  ])

  it('groups A–Z with non-letters last and folds accents', () => {
    expect(groups.map(group => group.letter)).toEqual(['A', 'B', 'E', '#'])
    expect(groups.find(group => group.letter === 'E')?.items.map(item => item.id)).toEqual(['4'])
  })

  it('sorts case-insensitively and breaks ties by id', () => {
    expect(groups[0].items.map(item => item.id)).toEqual(['1', '5'])
  })
})
