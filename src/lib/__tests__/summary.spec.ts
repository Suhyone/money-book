import { describe, expect, it } from 'vitest'
import { byNewest, groupByDate, totals, totalsByCategory, totalsByMonth } from '../summary'
import type { Transaction } from '@/types'

let seq = 0
function tx(overrides: Partial<Transaction>): Transaction {
  seq += 1
  return {
    id: `t${seq}`,
    type: 'expense',
    amount: 100,
    categoryId: 'food',
    date: '2026-10-01',
    note: '',
    recurringId: null,
    createdAt: seq,
    updatedAt: seq,
    ...overrides,
  }
}

describe('summary', () => {
  const rows = [
    tx({ type: 'income', amount: 10000, categoryId: 'salary', date: '2026-10-01' }),
    tx({ amount: 300, categoryId: 'food', date: '2026-10-01' }),
    tx({ amount: 500, categoryId: 'travel', date: '2026-10-02' }),
    tx({ amount: 400, categoryId: 'food', date: '2026-09-30' }),
  ]

  it('totals', () => {
    expect(totals(rows)).toEqual({ income: 10000, expense: 1200, balance: 8800 })
  })

  it('totalsByCategory เรียงมากไปน้อย', () => {
    expect(totalsByCategory(rows, 'expense')).toEqual([
      { categoryId: 'food', amount: 700 },
      { categoryId: 'travel', amount: 500 },
    ])
  })

  it('groupByDate รวมยอดสุทธิรายวัน', () => {
    const groups = groupByDate([...rows].sort(byNewest))
    expect(groups.map((g) => [g.date, g.net, g.items.length])).toEqual([
      ['2026-10-02', -500, 1],
      ['2026-10-01', 9700, 2],
      ['2026-09-30', -400, 1],
    ])
  })

  it('totalsByMonth', () => {
    expect(totalsByMonth(rows, ['2026-09', '2026-10', '2026-11'])).toEqual([
      { income: 0, expense: 400, balance: -400 },
      { income: 10000, expense: 800, balance: 9200 },
      { income: 0, expense: 0, balance: 0 },
    ])
  })
})
