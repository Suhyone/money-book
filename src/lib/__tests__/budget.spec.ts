import { describe, expect, it } from 'vitest'
import { budgetLevel, budgetPercent, crossedLevel } from '../budget'

describe('budgetLevel', () => {
  it.each([
    [0, 0, 'ok'],
    [79, 100, 'ok'],
    [80, 100, 'warn'],
    [100, 100, 'warn'],
    [101, 100, 'over'],
  ] as const)('ใช้ %i จากงบ %i → %s', (spent, limit, level) => {
    expect(budgetLevel(spent, limit)).toBe(level)
  })
})

describe('crossedLevel', () => {
  it.each([
    [70, 85, 100, 'warn'],
    [85, 95, 100, null],
    [95, 120, 100, 'over'],
    [70, 120, 100, 'over'],
    [120, 130, 100, null],
    [90, 70, 100, null],
    [50, 60, 0, null],
  ] as const)('ก่อน %i หลัง %i งบ %i → %s', (before, after, limit, expected) => {
    expect(crossedLevel(before, after, limit)).toBe(expected)
  })
})

it('budgetPercent', () => {
  expect(budgetPercent(50, 200)).toBe(25)
  expect(budgetPercent(50, 0)).toBe(0)
})
