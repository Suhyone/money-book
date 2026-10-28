/**
 * จำนวนเงินทั้งแอปเก็บเป็น "สตางค์" (จำนวนเต็ม) เช่น 125.50 บาท = 12550
 * เพื่อเลี่ยงปัญหาทศนิยมของ float (0.1 + 0.2 !== 0.3)
 */
export type Satang = number

/** 1,000 ล้านบาท — กันพิมพ์เลขเกินจนคำนวณเพี้ยน */
export const MAX_SATANG = 100_000_000_000

const currencyFormat = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 123450 → "฿1,234.50" */
export function formatBaht(satang: Satang): string {
  return currencyFormat.format(satang / 100)
}

/** แปลงข้อความที่ผู้ใช้พิมพ์เป็นสตางค์ เช่น "1,234.5" → 123450 (ทศนิยมไม่เกิน 2 ตำแหน่ง) ถ้าไม่ถูกต้องคืน null */
export function parseBaht(input: string): Satang | null {
  const cleaned = input.replace(/[,\s฿]/g, '')
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(cleaned)
  if (!match || !/\d/.test(cleaned)) return null
  const whole = match[1] ?? ''
  const fraction = match[2] ?? ''
  const satang = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'))
  return satang <= MAX_SATANG ? satang : null
}

/** สำหรับใส่ในช่องกรอกตอนแก้ไข: 123450 → "1234.50", 120000 → "1200" */
export function satangToInput(satang: Satang): string {
  const fraction = satang % 100
  const whole = (satang - fraction) / 100
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`
}

/** ทศนิยม 2 ตำแหน่งเสมอ ไม่มีคอมมา (ใช้ใน CSV): 123450 → "1234.50", -500 → "-5.00" */
export function satangToDecimal(satang: Satang): string {
  const sign = satang < 0 ? '-' : ''
  const abs = Math.abs(satang)
  const fraction = abs % 100
  return `${sign}${(abs - fraction) / 100}.${String(fraction).padStart(2, '0')}`
}
