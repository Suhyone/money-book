import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  formatDayHeader,
  formatMonthLabel,
  isValidISODate,
  monthRange,
  toISODate,
} from '../dates'

describe('คำนวณวันที่', () => {
  it('addMonths ข้ามปีได้', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-10', -12)).toBe('2025-10')
  })

  it('monthRange รู้จักปีอธิกสุรทิน', () => {
    expect(monthRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' })
    expect(monthRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  })

  it('addDays ข้ามเดือน/ปีได้', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('isValidISODate', () => {
    expect(isValidISODate('2026-02-28')).toBe(true)
    expect(isValidISODate('2026-02-30')).toBe(false)
    expect(isValidISODate('2026-2-1')).toBe(false)
  })

  it('toISODate ใช้เวลาท้องถิ่น', () => {
    expect(toISODate(new Date(2026, 9, 28, 23, 59))).toBe('2026-10-28')
  })
})

describe('แสดงผลภาษาไทย', () => {
  it('ชื่อเดือนเป็น พ.ศ.', () => {
    const label = formatMonthLabel('2026-10')
    expect(label).toContain('ตุลาคม')
    expect(label).toContain('2569')
  })

  it('หัวกลุ่มวันนี้/เมื่อวาน', () => {
    expect(formatDayHeader('2026-10-28', '2026-10-28')).toBe('วันนี้')
    expect(formatDayHeader('2026-10-27', '2026-10-28')).toBe('เมื่อวาน')
    expect(formatDayHeader('2026-10-20', '2026-10-28')).toContain('20')
  })
})
