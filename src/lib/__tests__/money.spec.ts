import { describe, expect, it } from 'vitest'
import { formatBaht, parseBaht, satangToDecimal, satangToInput } from '../money'

describe('parseBaht', () => {
  it.each([
    ['1,234.5', 123450],
    ['฿ 99', 9900],
    ['.5', 50],
    ['12.', 1200],
    ['0.05', 5],
    ['0', 0],
  ])('"%s" → %i สตางค์', (input, expected) => {
    expect(parseBaht(input)).toBe(expected)
  })

  it.each(['', '.', 'abc', '1.234', '-5', '1e3', '1.2.3', '99999999999'])(
    '"%s" ไม่ถูกต้อง',
    (input) => {
      expect(parseBaht(input)).toBeNull()
    },
  )
})

describe('การแสดงผลจำนวนเงิน', () => {
  it('formatBaht ใส่สัญลักษณ์บาทและคอมมา', () => {
    const text = formatBaht(123450)
    expect(text).toContain('฿')
    expect(text).toContain('1,234.50')
  })

  it('satangToInput ตัด .00 ทิ้ง', () => {
    expect(satangToInput(123450)).toBe('1234.50')
    expect(satangToInput(120000)).toBe('1200')
    expect(satangToInput(5)).toBe('0.05')
  })

  it('satangToDecimal มีทศนิยม 2 ตำแหน่งเสมอ', () => {
    expect(satangToDecimal(123450)).toBe('1234.50')
    expect(satangToDecimal(-500)).toBe('-5.00')
    expect(satangToDecimal(7)).toBe('0.07')
  })
})
