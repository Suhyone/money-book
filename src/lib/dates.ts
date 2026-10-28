/** วันที่แบบ 'YYYY-MM-DD' ตามเวลาท้องถิ่น (ไม่มีเวลา/โซนเวลา จึงเทียบกันแบบ string ได้เลย) */
export type ISODate = string
/** เดือนแบบ 'YYYY-MM' */
export type MonthKey = string

export const WEEKDAYS_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
export const MONTHS_TH = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const pad2 = (n: number) => String(n).padStart(2, '0')

/** month เป็น 1–12 */
export function isoFromParts(year: number, month: number, day: number): ISODate {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function toISODate(d: Date): ISODate {
  return isoFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

/** คืน Date เวลาเที่ยงคืนตามเวลาท้องถิ่น */
export function parseISODate(date: ISODate): Date {
  return new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))
}

export function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toISODate(parseISODate(value)) === value
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now)
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = parseISODate(date)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** month เป็น 1–12 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function monthKeyOf(date: ISODate): MonthKey {
  return date.slice(0, 7)
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return monthKeyOf(toISODate(now))
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const total = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + delta
  return `${Math.floor(total / 12)}-${pad2((total % 12) + 1)}`
}

/** วันแรกและวันสุดท้ายของเดือน */
export function monthRange(month: MonthKey): { start: ISODate; end: ISODate } {
  const last = daysInMonth(Number(month.slice(0, 4)), Number(month.slice(5, 7)))
  return { start: `${month}-01`, end: `${month}-${pad2(last)}` }
}

// locale th-TH ใช้ปฏิทินพุทธ (พ.ศ.) ให้อัตโนมัติ
const monthLabelFormat = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' })
const shortMonthFormat = new Intl.DateTimeFormat('th-TH', { month: 'short' })
const dateFormat = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dayHeaderFormat = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

/** "2026-10" → "ตุลาคม 2569" */
export function formatMonthLabel(month: MonthKey): string {
  return monthLabelFormat.format(parseISODate(`${month}-01`))
}

/** "2026-10" → "ต.ค." (ใช้เป็นป้ายกราฟ) */
export function formatShortMonth(month: MonthKey): string {
  return shortMonthFormat.format(parseISODate(`${month}-01`))
}

/** "2026-10-28" → "28 ต.ค. 2569" */
export function formatDate(date: ISODate): string {
  return dateFormat.format(parseISODate(date))
}

/** หัวกลุ่มรายการรายวัน: "วันนี้", "เมื่อวาน" หรือ "อ. 28 ต.ค." */
export function formatDayHeader(date: ISODate, today: ISODate = todayISO()): string {
  if (date === today) return 'วันนี้'
  if (date === addDays(today, -1)) return 'เมื่อวาน'
  return dayHeaderFormat.format(parseISODate(date))
}
