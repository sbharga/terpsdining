import { describe, expect, it } from 'vitest'
import { calendarDates, historyDays, historyRuns, runDetail, runLabel, topHall, type HistoryRow, type HistoryRun } from './history'
import type { Meal } from './hours'

const north = { slug: '251-north', name: '251 North' }
const south = { slug: 'south-campus', name: 'South Campus' }
const row = (date: string, meal: Meal, hall: HistoryRow['hall']): HistoryRow => ({ date, meal, hall })
const both = (date: string, hall = north): HistoryRow[] => [row(date, 'Lunch', hall), row(date, 'Dinner', hall)]
const rows: HistoryRow[] = [
  ...['2026-11-16', '2026-11-17', '2026-11-18'].flatMap(date => both(date)),
  ...both('2026-11-15'),
  row('2026-11-15', 'Dinner', south),
  ...both('2026-11-13'),
]
const run = (from: string, to: string, days: number): HistoryRun => ({ from, to, days, halls: [] })

describe('history', () => {
  it('builds a Sunday-start calendar window ending on this week’s Saturday', () => {
    const dates = calendarDates('2026-11-19', 6)
    expect(dates).toHaveLength(42)
    expect(dates[0]).toBe('2026-10-11')
    expect(dates[41]).toBe('2026-11-21')
  })

  it('merges identical consecutive days and splits on hall changes and gaps', () => {
    expect(historyRuns(historyDays(rows)).map(r => [r.from, r.to, r.days])).toEqual([
      ['2026-11-16', '2026-11-18', 3],
      ['2026-11-15', '2026-11-15', 1],
      ['2026-11-13', '2026-11-13', 1],
    ])
  })

  it('labels runs', () => {
    expect(runLabel(run('2026-11-16', '2026-11-18', 3))).toBe('Nov 16–18')
    expect(runLabel(run('2026-10-30', '2026-11-02', 4))).toBe('Oct 30 – Nov 2')
    expect(runLabel(run('2026-11-18', '2026-11-18', 1))).toBe('Nov 18')
  })

  it('describes runs', () => {
    expect(runDetail(run('2026-11-16', '2026-11-18', 3), '2026-11-19')).toBe('Mon–Wed · 3 days')
    expect(runDetail(run('2026-11-18', '2026-11-18', 1), '2026-11-19')).toBe('Yesterday')
    expect(runDetail(run('2026-11-13', '2026-11-13', 1), '2026-11-19')).toBe('Fri')
  })

  it('finds the most frequent hall, breaking ties by name', () => {
    expect(topHall(historyDays(rows))).toEqual({ slug: '251-north', name: '251 North', days: 5 })
    expect(topHall(historyDays([row('2026-11-01', 'Lunch', south), row('2026-11-02', 'Lunch', north)]))).toEqual({ slug: '251-north', name: '251 North', days: 1 })
    expect(topHall(historyDays([row('2026-11-01', 'Lunch', null)]))).toBeNull()
  })
})
