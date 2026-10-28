import {
  addDays,
  daysInMonth,
  isoFromParts,
  MONTHS_TH,
  parseISODate,
  WEEKDAYS_TH,
  type ISODate,
} from './dates'

export type Frequency = 'weekly' | 'monthly' | 'yearly'

export interface Schedule {
  frequency: Frequency
  /** 0 = อาทิตย์ … 6 = เสาร์ (ใช้กับ weekly) */
  weekday: number
  /** 1–31 (ใช้กับ monthly/yearly) เดือนไหนไม่มีวันนั้นจะใช้วันสุดท้ายของเดือนแทน */
  dayOfMonth: number
  /** 1–12 (ใช้กับ yearly) */
  month: number
  startDate: ISODate
  endDate: ISODate | null
}

/** กันลูปยาวผิดปกติ เช่นตั้งวันเริ่มย้อนไปหลายสิบปี */
export const MAX_OCCURRENCES = 1000

function clampedDate(year: number, month: number, day: number): ISODate {
  return isoFromParts(year, month, Math.min(day, daysInMonth(year, month)))
}

/**
 * วันที่ถึงกำหนดทั้งหมดในช่วง (afterExclusive, untilInclusive] เรียงจากเก่าไปใหม่
 * afterExclusive = null หมายถึงนับตั้งแต่ startDate
 */
export function occurrencesBetween(
  schedule: Schedule,
  afterExclusive: ISODate | null,
  untilInclusive: ISODate,
): ISODate[] {
  let from = schedule.startDate
  if (afterExclusive !== null && afterExclusive >= from) from = addDays(afterExclusive, 1)
  const to =
    schedule.endDate !== null && schedule.endDate < untilInclusive
      ? schedule.endDate
      : untilInclusive
  const result: ISODate[] = []
  if (from > to) return result

  if (schedule.frequency === 'weekly') {
    const shift = (schedule.weekday - parseISODate(from).getDay() + 7) % 7
    for (
      let d = addDays(from, shift);
      d <= to && result.length < MAX_OCCURRENCES;
      d = addDays(d, 7)
    ) {
      result.push(d)
    }
    return result
  }

  let year = Number(from.slice(0, 4))
  let month = schedule.frequency === 'yearly' ? schedule.month : Number(from.slice(5, 7))
  while (result.length < MAX_OCCURRENCES) {
    const d = clampedDate(year, month, schedule.dayOfMonth)
    if (d > to) break
    if (d >= from) result.push(d)
    if (schedule.frequency === 'yearly') {
      year += 1
    } else if (month === 12) {
      month = 1
      year += 1
    } else {
      month += 1
    }
  }
  return result
}

/** ครั้งถัดไปตั้งแต่ fromInclusive เป็นต้นไป (null ถ้าสิ้นสุดแล้ว) */
export function nextOccurrence(schedule: Schedule, fromInclusive: ISODate): ISODate | null {
  return (
    occurrencesBetween(schedule, addDays(fromInclusive, -1), addDays(fromInclusive, 372))[0] ?? null
  )
}

/** ค่าเริ่มต้นให้ตรงกับวันเริ่ม เช่นเริ่ม 5 มี.ค. (วันพฤหัส) → ทุกวันพฤหัส / ทุกวันที่ 5 / ทุก 5 มี.ค. */
export function scheduleDefaults(
  startDate: ISODate,
): Pick<Schedule, 'weekday' | 'dayOfMonth' | 'month'> {
  return {
    weekday: parseISODate(startDate).getDay(),
    dayOfMonth: Number(startDate.slice(8, 10)),
    month: Number(startDate.slice(5, 7)),
  }
}

/** ข้อความสั้นๆ เช่น "ทุกวันจันทร์", "ทุกเดือน วันที่ 5", "ทุกวันสิ้นเดือน", "ทุกปี 15 มีนาคม" */
export function describeSchedule(schedule: Schedule): string {
  switch (schedule.frequency) {
    case 'weekly':
      return `ทุกวัน${WEEKDAYS_TH[schedule.weekday] ?? ''}`
    case 'monthly':
      return schedule.dayOfMonth >= 31
        ? 'ทุกวันสิ้นเดือน'
        : `ทุกเดือน วันที่ ${schedule.dayOfMonth}`
    case 'yearly':
      return `ทุกปี ${schedule.dayOfMonth} ${MONTHS_TH[schedule.month - 1] ?? ''}`
  }
}
