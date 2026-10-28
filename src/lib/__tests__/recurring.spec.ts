import { describe, expect, it } from 'vitest'
import {
  describeSchedule,
  MAX_OCCURRENCES,
  nextOccurrence,
  occurrencesBetween,
  type Schedule,
} from '../recurring'

function schedule(overrides: Partial<Schedule>): Schedule {
  return {
    frequency: 'monthly',
    weekday: 1,
    dayOfMonth: 1,
    month: 1,
    startDate: '2026-01-01',
    endDate: null,
    ...overrides,
  }
}

describe('occurrencesBetween', () => {
  it('รายเดือนวันที่ 31 ใช้วันสุดท้ายของเดือนที่สั้นกว่า', () => {
    expect(occurrencesBetween(schedule({ dayOfMonth: 31 }), null, '2026-04-30')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ])
  })

  it('รายเดือนวันที่ 29 ในปีอธิกสุรทิน', () => {
    const s = schedule({ dayOfMonth: 29, startDate: '2024-02-01' })
    expect(occurrencesBetween(s, null, '2024-03-31')).toEqual(['2024-02-29', '2024-03-29'])
  })

  it('รายปี 29 ก.พ. ปีปกติใช้ 28 ก.พ.', () => {
    const s = schedule({ frequency: 'yearly', month: 2, dayOfMonth: 29, startDate: '2024-01-01' })
    expect(occurrencesBetween(s, null, '2028-12-31')).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ])
  })

  it('รายสัปดาห์เริ่มจากวันที่ตรงกับ weekday', () => {
    // 2026-10-28 เป็นวันพุธ, weekday 1 = จันทร์
    const s = schedule({ frequency: 'weekly', weekday: 1, startDate: '2026-10-28' })
    expect(occurrencesBetween(s, null, '2026-11-15')).toEqual(['2026-11-02', '2026-11-09'])
  })

  it('ไม่นับวัน afterExclusive ซ้ำ', () => {
    const s = schedule({ dayOfMonth: 5 })
    expect(occurrencesBetween(s, '2026-03-05', '2026-05-31')).toEqual(['2026-04-05', '2026-05-05'])
  })

  it('หยุดที่ endDate', () => {
    const s = schedule({ dayOfMonth: 10, endDate: '2026-03-10' })
    expect(occurrencesBetween(s, null, '2026-12-31')).toEqual([
      '2026-01-10',
      '2026-02-10',
      '2026-03-10',
    ])
  })

  it('วันเริ่มยังไม่ถึงคืนรายการว่าง', () => {
    expect(occurrencesBetween(schedule({ startDate: '2027-01-01' }), null, '2026-12-31')).toEqual(
      [],
    )
  })

  it('จำกัดจำนวนครั้งกันลูปยาว', () => {
    const s = schedule({ frequency: 'weekly', startDate: '1990-01-01' })
    expect(occurrencesBetween(s, null, '2026-12-31')).toHaveLength(MAX_OCCURRENCES)
  })
})

describe('nextOccurrence / describeSchedule', () => {
  it('ครั้งถัดไปนับวันนี้ด้วย', () => {
    const s = schedule({ dayOfMonth: 5 })
    expect(nextOccurrence(s, '2026-10-28')).toBe('2026-11-05')
    expect(nextOccurrence(s, '2026-11-05')).toBe('2026-11-05')
    expect(nextOccurrence({ ...s, endDate: '2026-10-31' }, '2026-10-28')).toBeNull()
  })

  it('ข้อความอธิบาย', () => {
    expect(describeSchedule(schedule({ frequency: 'weekly', weekday: 1 }))).toBe('ทุกวันจันทร์')
    expect(describeSchedule(schedule({ dayOfMonth: 5 }))).toBe('ทุกเดือน วันที่ 5')
    expect(describeSchedule(schedule({ dayOfMonth: 31 }))).toBe('ทุกวันสิ้นเดือน')
    expect(describeSchedule(schedule({ frequency: 'yearly', month: 3, dayOfMonth: 15 }))).toBe(
      'ทุกปี 15 มีนาคม',
    )
  })
})
