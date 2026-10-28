import { describe, expect, it } from 'vitest'
import { escapeCsvCell, neutralizeFormula, transactionsToCsv, UTF8_BOM } from '../csv'

describe('CSV', () => {
  it('ครอบเครื่องหมายคำพูดเมื่อจำเป็น', () => {
    expect(escapeCsvCell('ข้าว')).toBe('ข้าว')
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvCell('line\nbreak')).toBe('"line\nbreak"')
  })

  it('กันสูตร Excel', () => {
    expect(neutralizeFormula('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(neutralizeFormula('ค่าข้าว')).toBe('ค่าข้าว')
  })

  it('transactionsToCsv: มี BOM, รายจ่ายติดลบ, ขึ้นบรรทัดแบบ CRLF', () => {
    const csv = transactionsToCsv([
      { date: '2026-10-01', type: 'income', categoryName: 'เงินเดือน', amount: 2500000, note: '' },
      {
        date: '2026-10-02',
        type: 'expense',
        categoryName: 'อาหาร',
        amount: 12000,
        note: 'ข้าว, น้ำ',
      },
    ])
    expect(csv.startsWith(UTF8_BOM)).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'วันที่,ประเภท,หมวดหมู่,จำนวนเงิน (บาท),บันทึก',
      '2026-10-01,รายรับ,เงินเดือน,25000.00,',
      '2026-10-02,รายจ่าย,อาหาร,-120.00,"ข้าว, น้ำ"',
      '',
    ])
  })
})
